"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { VenueWithSettings } from "@/data/demo-venues";
import { getStoredMobile, getStoredGuestName, getStoredWhatsAppOptIn } from "@/lib/session-mobile";
import type { FeedbackScores, GeneratedReview } from "@/types/venue";
import type { VenueType } from "@/types/venue";
import type { CustomQuestion } from "@/types/venue";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { EmojiRating } from "@/components/feedback/emoji-rating";
import { YesNoChoice } from "@/components/feedback/yes-no-choice";
import { TextQuestion } from "@/components/feedback/text-question";
import { TagChoice } from "@/components/feedback/tag-choice";
import { ThankYouLottie } from "@/components/feedback/thank-you-lottie";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/** Ideal flow: emotion → aspect → aspect → positive text → yes/no → optional text → review (photo step removed) */
const DEFAULT_STEPS: (Omit<CustomQuestion, "id"> & { id: string })[] = [
  { id: "service", title: "How did our service make you feel today?", type: "emoji", key: "service", order: 0 },
  { id: "cleanliness", title: "How was the cleanliness?", type: "emoji", key: "cleanliness", order: 1 },
  { id: "quality", title: "How was the food?", type: "emoji", key: "quality", order: 2 },
  { id: "value", title: "How was the value for money?", type: "emoji", key: "value", order: 3 },
  { id: "overall", title: "Overall, how was your experience?", type: "emoji", key: "overall", order: 4 },
  { id: "what_liked", title: "What did you enjoy the most?", type: "text", key: "what_liked", order: 5, placeholder: "e.g. The dessert and the friendly server!" },
  { id: "would_recommend", title: "Would you recommend us to friends?", type: "yesNo", key: "would_recommend", order: 6, yesNoLabels: ["Yes", "No"] },
  { id: "optionalText", title: "Anything else you'd like to share? (optional)", type: "text", key: "optionalText", order: 7, placeholder: "Optional..." },
];

type FlowOutcome = "google" | "private" | null;

interface FeedbackFlowProps {
  venue: VenueWithSettings;
}

function averageAspectScore(scores: Partial<FeedbackScores>): number {
  const keys: (keyof FeedbackScores)[] = ["overall", "service", "cleanliness", "foodQuality", "roomQuality", "value"];
  let sum = 0;
  let count = 0;
  for (const k of keys) {
    const v = scores[k];
    if (typeof v === "number") {
      sum += v;
      count++;
    }
  }
  return count > 0 ? sum / count : 0;
}

function getScoreKey(key: string, venueType: VenueType): keyof FeedbackScores {
  if (key === "quality") return venueType === "restaurant" ? "foodQuality" : "roomQuality";
  return key as keyof FeedbackScores;
}

export function FeedbackFlow({ venue }: FeedbackFlowProps) {
  const { settings } = venue;
  const startTimeRef = useRef<number>(Date.now());

  const steps = useMemo(() => {
    if (settings.customQuestions.length > 0) {
      return [...settings.customQuestions].sort((a, b) => a.order - b.order);
    }
    return DEFAULT_STEPS.map((s) => ({ ...s, title: s.key === "quality" && venue.type === "hotel" ? "How was the room?" : s.title }));
  }, [settings.customQuestions, venue.type]);

  const totalSteps = steps.length;
  const [step, setStep] = useState(0);
  const [scores, setScores] = useState<Partial<FeedbackScores>>({});
  const [textAnswers, setTextAnswers] = useState<Record<string, string>>({});
  const [yesNoAnswers, setYesNoAnswers] = useState<Record<string, boolean>>({});
  const [review, setReview] = useState<GeneratedReview | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [done, setDone] = useState(false);
  const [outcome, setOutcome] = useState<FlowOutcome>(null);

  const progress = totalSteps > 0 ? ((step + 1) / totalSteps) * 100 : 0;
  const currentStepConfig = step < totalSteps ? steps[step] : null;
  const microCopy = step < totalSteps
    ? (step === totalSteps - 1 ? "Last question!" : step === totalSteps - 2 ? "Almost there 🎉" : `Question ${step + 1} of ${totalSteps}`)
    : "";

  const advanceStep = useCallback(() => {
    setStep((s) => Math.min(s + 1, totalSteps));
  }, [totalSteps]);

  const handleEmoji = useCallback((value: number) => {
    if (!currentStepConfig || currentStepConfig.type !== "emoji") return;
    const scoreKey = getScoreKey(currentStepConfig.key as string, venue.type);
    setScores((s) => ({ ...s, [scoreKey]: value }));
    advanceStep();
  }, [currentStepConfig, venue.type, advanceStep]);

  const handleYesNo = useCallback((value: boolean) => {
    if (!currentStepConfig || currentStepConfig.type !== "yesNo") return;
    setYesNoAnswers((a) => ({ ...a, [currentStepConfig.key]: value }));
    advanceStep();
  }, [currentStepConfig, advanceStep]);

  const handleSingleChoice = useCallback((value: string) => {
    if (!currentStepConfig || currentStepConfig.type !== "singleChoice") return;
    setTextAnswers((a) => ({ ...a, [currentStepConfig.key]: value }));
    advanceStep();
  }, [currentStepConfig, advanceStep]);

  const handleMultiChoice = useCallback((value: string | string[]) => {
    if (!currentStepConfig || currentStepConfig.type !== "multiChoice") return;
    const arr = Array.isArray(value) ? value : [value];
    setTextAnswers((a) => ({ ...a, [currentStepConfig.key]: JSON.stringify(arr) }));
  }, [currentStepConfig]);

  const handleText = useCallback((value: string) => {
    if (!currentStepConfig) return;
    setTextAnswers((a) => ({ ...a, [currentStepConfig.key]: value }));
  }, [currentStepConfig]);

  const handleNextFromText = useCallback(() => {
    advanceStep();
  }, [advanceStep]);


  const sendWhatsAppIfOptedIn = useCallback((mobileNum: string) => {
    if (!getStoredWhatsAppOptIn(venue.id)) return;
    fetch("/api/feedback/send-whatsapp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        venueId: venue.id,
        mobile: mobileNum,
        venueName: venue.name,
      }),
    }).catch(() => {});
  }, [venue.id, venue.name]);

  const saveSubmission = useCallback(
    async (payload: {
      generatedReviewText?: string;
      reviewOutcome: "google_redirect" | "private";
    }) => {
      const optionalText = textAnswers["optionalText"] ?? "";
      const mobile = getStoredMobile(venue.id);
      const guestName = getStoredGuestName(venue.id);
      const avg = averageAspectScore(scores);
      await fetch("/api/feedback/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          venueId: venue.id,
          tenantId: venue.tenantId,
          mobile: mobile || undefined,
          guestName: guestName || undefined,
          scores: { ...scores, overall: scores.overall ?? Math.round(avg) },
          textAnswers: Object.keys(textAnswers).length ? textAnswers : undefined,
          yesNoAnswers: Object.keys(yesNoAnswers).length ? yesNoAnswers : undefined,
          optionalText: optionalText || undefined,
          sessionId: typeof window !== "undefined" ? crypto.randomUUID?.() ?? undefined : undefined,
          generatedReviewText: payload.generatedReviewText,
          reviewOutcome: payload.reviewOutcome,
        }),
      }).catch(() => {});
    },
    [scores, textAnswers, yesNoAnswers, venue]
  );

  const submitForReview = useCallback(async () => {
    const avg = averageAspectScore(scores);
    const optionalText = textAnswers["optionalText"] ?? "";
    const mobile = getStoredMobile(venue.id);

    if (avg < 3) {
      setOutcome("private");
      setDone(false);
      await saveSubmission({ reviewOutcome: "private" });
      if (mobile) sendWhatsAppIfOptedIn(mobile);
      return;
    }

    if (avg >= 4) {
      setOutcome("google");
      setIsGenerating(true);
      try {
        const res = await fetch("/api/feedback/generate-review", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            venueId: venue.id,
            venueName: venue.name,
            venueType: venue.type,
            mobile: mobile || undefined,
            scores: { ...scores, overall: scores.overall ?? Math.round(avg) },
            textAnswers: Object.keys(textAnswers).length ? textAnswers : undefined,
            yesNoAnswers: Object.keys(yesNoAnswers).length ? yesNoAnswers : undefined,
            optionalText: optionalText || undefined,
            recentOrderItems: undefined,
          }),
        });
        const data = await res.json();
        const generatedReview = data.review
          ? data.review
          : mockReview(scores, textAnswers, yesNoAnswers, venue);
        setReview(generatedReview);
        await saveSubmission({
          reviewOutcome: "google_redirect",
          generatedReviewText: generatedReview.text,
        });
        if (mobile) sendWhatsAppIfOptedIn(mobile);
      } catch {
        const generatedReview = mockReview(scores, textAnswers, yesNoAnswers, venue);
        setReview(generatedReview);
        await saveSubmission({
          reviewOutcome: "google_redirect",
          generatedReviewText: generatedReview.text,
        });
        if (mobile) sendWhatsAppIfOptedIn(mobile);
      } finally {
        setIsGenerating(false);
      }
      return;
    }

    setOutcome("private");
    setDone(false);
    await saveSubmission({ reviewOutcome: "private" });
    if (mobile) sendWhatsAppIfOptedIn(mobile);
  }, [scores, textAnswers, yesNoAnswers, venue, sendWhatsAppIfOptedIn, saveSubmission]);

  const claimRewardLabel = settings.uiText.claimRewardLabel ?? "I'm done — claim my reward";
  const thanksTitle = settings.uiText.thanksTitle ?? "Thanks! 🎁";
  const rewardCta = settings.uiText.rewardCta ?? venue.rewardCta;

  const currentScoreKey = currentStepConfig?.type === "emoji"
    ? getScoreKey(currentStepConfig.key as string, venue.type)
    : null;
  const currentScore = currentScoreKey ? scores[currentScoreKey as keyof FeedbackScores] ?? null : null;
  const currentText = currentStepConfig?.type === "text" ? (textAnswers[currentStepConfig.key] ?? "") : "";
  const currentYesNo = currentStepConfig?.type === "yesNo" ? (yesNoAnswers[currentStepConfig.key] ?? null) : null;
  const currentChoiceRaw = currentStepConfig?.type === "singleChoice" || currentStepConfig?.type === "multiChoice"
    ? textAnswers[currentStepConfig.key]
    : undefined;
  const currentChoiceValue: string | string[] | null =
    currentStepConfig?.type === "multiChoice" && currentChoiceRaw
      ? (() => {
          try {
            const parsed = JSON.parse(currentChoiceRaw) as unknown;
            return Array.isArray(parsed) ? (parsed as string[]) : [currentChoiceRaw];
          } catch {
            return currentChoiceRaw ? [currentChoiceRaw] : null;
          }
        })()
      : currentStepConfig?.type === "singleChoice"
        ? (currentChoiceRaw ?? null)
        : null;

  return (
    <div className="font-sans">
      <div className="mb-6 flex items-center justify-between gap-3">
        <Progress value={progress} className="h-2 flex-1 rounded-full" />
        <span className="text-sm font-medium text-muted-foreground tabular-nums">{microCopy}</span>
      </div>

      <AnimatePresence mode="wait">
        {step < totalSteps && currentStepConfig && (
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.25 }}
            className="flex-1 flex flex-col"
          >
            <Card className="flex-1 flex flex-col rounded-2xl border border-border/60 bg-card shadow-lg shadow-black/5 transition-all duration-300">
              <CardHeader className="pb-4 pt-6">
                <CardTitle className="text-xl font-semibold leading-tight tracking-tight text-foreground">
                  {currentStepConfig.key === "quality" && venue.type === "hotel" ? "How was the room?" : currentStepConfig.title}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">{microCopy}</p>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col gap-6 pb-8">
                {currentStepConfig.type === "emoji" && (
                  <EmojiRating
                    value={currentScore}
                    onChange={handleEmoji}
                    label=""
                    variant={currentStepConfig.ratingStyle ?? settings.defaultRatingStyle ?? "star"}
                  />
                )}
                {currentStepConfig.type === "yesNo" && (
                  <YesNoChoice
                    value={currentYesNo}
                    onChange={handleYesNo}
                    labels={currentStepConfig.yesNoLabels}
                  />
                )}
                {currentStepConfig.type === "singleChoice" && currentStepConfig.options && (
                  <TagChoice
                    options={currentStepConfig.options}
                    value={currentChoiceValue as string | null}
                    onChange={(v) => handleSingleChoice(typeof v === "string" ? v : v[0] ?? "")}
                  />
                )}
                {currentStepConfig.type === "multiChoice" && currentStepConfig.options && (
                  <>
                    <TagChoice
                      options={currentStepConfig.options}
                      value={currentChoiceValue as string[] | null}
                      multiSelect
                      onChange={handleMultiChoice}
                      subtitle="Select all that apply"
                    />
                    <Button
                      onClick={step === totalSteps - 1 ? submitForReview : handleNextFromText}
                      size="lg"
                      className="mt-2"
                    >
                      Continue →
                    </Button>
                  </>
                )}
                {currentStepConfig.type === "text" && (
                  <>
                    <TextQuestion
                      value={currentText}
                      onChange={handleText}
                      placeholder={currentStepConfig.placeholder}
                      multiline={currentStepConfig.key !== "optionalText" || true}
                      maxLength={2000}
                      showVoiceButton
                      enableFormatWithAI
                    />
                    <Button
                      onClick={step === totalSteps - 1 ? submitForReview : handleNextFromText}
                      size="lg"
                      className="mt-2"
                    >
                      Continue →
                    </Button>
                  </>
                )}
                {step > 0 && currentStepConfig.type !== "text" && (
                  <Button variant="ghost" className="self-start mt-2" onClick={() => setStep((s) => s - 1)}>
                    ← Back
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {outcome === "private" && !review && (
          <motion.div key="private" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }} className="flex-1 flex flex-col">
            <Card className="rounded-2xl border border-border/80 bg-card shadow-lg shadow-black/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl font-semibold text-foreground">Thanks for your feedback</CardTitle>
                <p className="text-muted-foreground text-sm">This goes directly to management. We'll use it to improve — no public review.</p>
              </CardHeader>
              <CardContent>
                <Button onClick={() => setDone(true)} size="lg" className="transition-all duration-300">{claimRewardLabel}</Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {outcome === "google" && (
          <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col">
            {isGenerating ? (
              <Card className="rounded-2xl border border-border/60 bg-card shadow-lg shadow-black/5">
                <CardContent className="py-16 text-center text-muted-foreground">
                  <p className="font-medium">Creating your Google review...</p>
                  <p className="text-sm mt-2">Analyzing your answers into an SEO-friendly review.</p>
                </CardContent>
              </Card>
            ) : review ? (
              <GoogleReviewShareCard
                reviewText={review.text}
                googleReviewUrl={
                  settings.googleReviewUrl?.trim()
                    ? settings.googleReviewUrl.trim()
                    : venue.googlePlaceId
                      ? `https://search.google.com/local/writereview?placeid=${encodeURIComponent(venue.googlePlaceId)}`
                      : `https://www.google.com/search?q=${encodeURIComponent(venue.name)}+review`
                }
                onSkip={() => setDone(true)}
                claimRewardLabel={claimRewardLabel}
              />
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>

      {done && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="mt-8 rounded-2xl border border-accent/30 bg-accent/10 p-6 text-center shadow-sm"
        >
          <ThankYouLottie className="mb-4" />
          <p className="text-lg font-semibold text-foreground">You&apos;re all set!</p>
          <p className="text-lg font-semibold text-foreground mt-1">{thanksTitle}</p>
          <p className="text-muted-foreground mt-2">{rewardCta ?? "Show this screen for your reward at the counter."}</p>
        </motion.div>
      )}
    </div>
  );
}

/** Popup dimensions for Google review window (opens the review form in a focused window). */
const REVIEW_POPUP_WIDTH = 600;
const REVIEW_POPUP_HEIGHT = 720;

/** Opens Google review in popup or new tab. */
function openGoogleReview(googleReviewUrl: string) {
  const features = [
    "noopener",
    "noreferrer",
    `width=${REVIEW_POPUP_WIDTH}`,
    `height=${REVIEW_POPUP_HEIGHT}`,
    "scrollbars=yes",
    "resizable=yes",
  ].join(",");
  const opened = window.open(googleReviewUrl, "google_review", features);
  if (!opened) {
    window.open(googleReviewUrl, "_blank", "noopener,noreferrer");
  }
}

/** Copy + confirmation modal + toast; on continue, redirect to Google. */
function GoogleReviewShareCard({
  reviewText,
  googleReviewUrl,
  onSkip,
  claimRewardLabel,
}: {
  reviewText: string;
  googleReviewUrl: string;
  onSkip: () => void;
  claimRewardLabel: string;
}) {
  const [showModal, setShowModal] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const handleContinueToGoogle = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(reviewText);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3500);
    } catch {
      // Still show modal so user can manually copy
    }
    setShowModal(true);
  }, [reviewText]);

  const handleModalContinue = useCallback(() => {
    setShowModal(false);
    openGoogleReview(googleReviewUrl);
  }, [googleReviewUrl]);

  return (
    <>
      <Card className="rounded-2xl border border-border/60 bg-card shadow-lg shadow-black/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-semibold tracking-tight">
            Looks good? Share it on Google
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            We&apos;ll copy your review and open Google. Then paste, pick your stars, and submit.
          </p>
        </CardHeader>
        <CardContent className="space-y-5 pb-8">
          <div className="rounded-xl bg-muted/60 p-5 text-base leading-relaxed text-foreground">
            {reviewText}
          </div>
          <Button
            size="lg"
            className="w-full"
            onClick={handleContinueToGoogle}
          >
            Continue to Google & Paste Review
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            {googleReviewUrl.includes("writereview")
              ? "Your review is ready to paste. Select your star rating and submit."
              : "Add your Google review link in admin Settings for a direct review form."}
          </p>
          <Button variant="ghost" onClick={onSkip} className="w-full">
            {claimRewardLabel}
          </Button>
        </CardContent>
      </Card>

      {/* Toast: Review copied to clipboard */}
      {showToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-foreground text-background text-sm font-medium shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-300"
        >
          Review copied to clipboard
        </div>
      )}

      {/* Confirmation modal before redirect */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-in fade-in duration-200"
          onClick={() => setShowModal(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="review-ready-title"
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-card border border-border shadow-xl p-6 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="review-ready-title" className="text-xl font-semibold text-foreground">
              Your review is ready ✅
            </h2>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              We&apos;ve copied your review to your clipboard. When Google opens, just tap and hold in the text box, press Paste, and then click Post.
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <Button size="lg" className="w-full" onClick={handleModalContinue}>
                Continue
              </Button>
              <Button variant="ghost" size="sm" className="w-full" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function mockReview(
  scores: Partial<FeedbackScores>,
  textAnswers: Record<string, string>,
  yesNoAnswers: Record<string, boolean>,
  venue: VenueWithSettings
): GeneratedReview {
  const o = scores.overall ?? 3;
  const parts: string[] = [];
  if (o >= 4) parts.push(`Great experience at ${venue.name}.`);
  else if (o <= 2) parts.push(`Visited ${venue.name}.`);
  else parts.push(`Good experience at ${venue.name}.`);
  if (scores.service !== undefined && scores.service >= 4) parts.push("Service was friendly and prompt.");
  if (scores.cleanliness !== undefined && scores.cleanliness >= 4) parts.push("Everything was clean.");
  if (textAnswers.what_liked) parts.push(`Really liked ${textAnswers.what_liked}.`);
  if (textAnswers.optionalText) parts.push(textAnswers.optionalText);
  if (yesNoAnswers.would_recommend) parts.push("Would definitely recommend.");
  const text = parts.length > 0 ? parts.join(" ") : `Good experience at ${venue.name}. Would recommend.`;
  return { text, suggestedRating: o };
}

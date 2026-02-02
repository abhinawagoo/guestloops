"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { VenueWithSettings } from "@/data/demo-venues";
import { getStoredMobile, getStoredWhatsAppOptIn } from "@/lib/session-mobile";
import type { FeedbackScores, GeneratedReview } from "@/types/venue";
import type { VenueType } from "@/types/venue";
import type { CustomQuestion } from "@/types/venue";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { EmojiRating } from "@/components/feedback/emoji-rating";
import { YesNoChoice } from "@/components/feedback/yes-no-choice";
import { TextQuestion } from "@/components/feedback/text-question";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/** Ideal flow: emotion → aspect → aspect → positive text → yes/no → optional text → image → review */
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
  const imageStepIndex = totalSteps;
  const totalWithImage = totalSteps + 1;
  const [step, setStep] = useState(0);
  const [scores, setScores] = useState<Partial<FeedbackScores>>({});
  const [textAnswers, setTextAnswers] = useState<Record<string, string>>({});
  const [yesNoAnswers, setYesNoAnswers] = useState<Record<string, boolean>>({});
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [review, setReview] = useState<GeneratedReview | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [done, setDone] = useState(false);
  const [outcome, setOutcome] = useState<FlowOutcome>(null);

  const progress = totalWithImage > 0 ? ((step + 1) / totalWithImage) * 100 : 0;
  const currentStepConfig = step < totalSteps ? steps[step] : null;
  const isImageStep = step === totalSteps && outcome === null;
  const microCopy = step < totalSteps
    ? (step === totalSteps - 1 ? "Last question!" : step === totalSteps - 2 ? "Almost there 🎉" : `Question ${step + 1} of ${totalSteps}`)
    : "Add a photo (optional)";

  const handleEmoji = useCallback((value: number) => {
    if (!currentStepConfig || currentStepConfig.type !== "emoji") return;
    const scoreKey = getScoreKey(currentStepConfig.key as string, venue.type);
    setScores((s) => ({ ...s, [scoreKey]: value }));
    if (step < totalSteps - 1) setStep((s) => s + 1);
  }, [currentStepConfig, step, totalSteps, venue.type]);

  const handleYesNo = useCallback((value: boolean) => {
    if (!currentStepConfig || currentStepConfig.type !== "yesNo") return;
    setYesNoAnswers((a) => ({ ...a, [currentStepConfig.key]: value }));
    if (step < totalSteps - 1) setStep((s) => s + 1);
  }, [currentStepConfig, step, totalSteps]);

  const handleText = useCallback((value: string) => {
    if (!currentStepConfig) return;
    setTextAnswers((a) => ({ ...a, [currentStepConfig.key]: value }));
  }, [currentStepConfig]);

  const handleNextFromText = useCallback(() => {
    if (step < totalSteps - 1) setStep((s) => s + 1);
  }, [step, totalSteps]);


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

  const submitForReview = useCallback(async () => {
    const avg = averageAspectScore(scores);
    const optionalText = textAnswers["optionalText"] ?? "";
    const mobile = getStoredMobile(venue.id);

    if (avg < 3) {
      setOutcome("private");
      setDone(false);
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
            imageUrls: imageUrls.length ? imageUrls : undefined,
            recentOrderItems: undefined,
          }),
        });
        const data = await res.json();
        if (data.review) setReview(data.review);
        else setReview(mockReview(scores, textAnswers, yesNoAnswers, venue));
        if (mobile) sendWhatsAppIfOptedIn(mobile);
      } catch {
        setReview(mockReview(scores, textAnswers, yesNoAnswers, venue));
        if (mobile) sendWhatsAppIfOptedIn(mobile);
      } finally {
        setIsGenerating(false);
      }
      return;
    }

    setOutcome("private");
    if (mobile) sendWhatsAppIfOptedIn(mobile);
  }, [scores, textAnswers, yesNoAnswers, imageUrls, venue, sendWhatsAppIfOptedIn]);

  const handleContinueFromImage = useCallback(() => {
    submitForReview();
  }, [submitForReview]);

  const claimRewardLabel = settings.uiText.claimRewardLabel ?? "I'm done — claim my reward";
  const thanksTitle = settings.uiText.thanksTitle ?? "Thanks! 🎁";
  const rewardCta = settings.uiText.rewardCta ?? venue.rewardCta;

  const currentScoreKey = currentStepConfig?.type === "emoji"
    ? getScoreKey(currentStepConfig.key as string, venue.type)
    : null;
  const currentScore = currentScoreKey ? scores[currentScoreKey as keyof FeedbackScores] ?? null : null;
  const currentText = currentStepConfig?.type === "text" ? (textAnswers[currentStepConfig.key] ?? "") : "";
  const currentYesNo = currentStepConfig?.type === "yesNo" ? (yesNoAnswers[currentStepConfig.key] ?? null) : null;

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
                  />
                )}
                {currentStepConfig.type === "yesNo" && (
                  <YesNoChoice
                    value={currentYesNo}
                    onChange={handleYesNo}
                    labels={currentStepConfig.yesNoLabels}
                  />
                )}
                {currentStepConfig.type === "text" && (
                  <>
                    <TextQuestion
                      value={currentText}
                      onChange={handleText}
                      placeholder={currentStepConfig.placeholder}
                      multiline={currentStepConfig.key !== "optionalText" || true}
                      maxLength={500}
                    />
                    <Button onClick={handleNextFromText} size="lg" className="mt-2">
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

        {isImageStep && (
          <motion.div
            key="image"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col"
          >
            <Card className="rounded-2xl border border-border/60 bg-card shadow-lg shadow-black/5">
              <CardHeader className="pb-4 pt-6">
                <CardTitle className="text-xl font-semibold tracking-tight">Add a photo (optional)</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Photos improve trust and help your review stand out.</p>
              </CardHeader>
              <CardContent className="space-y-4 pb-8">
                <input
                  type="file"
                  accept="image/*"
                  className="block w-full text-sm text-muted-foreground file:mr-2 file:rounded-lg file:border-0 file:bg-primary file:px-4 file:py-2 file:text-primary-foreground file:font-medium"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setImageUrls((prev) => [...prev, URL.createObjectURL(f)]);
                  }}
                />
                <Button onClick={handleContinueFromImage} size="lg" className="w-full">
                  Continue to review →
                </Button>
                <Button variant="ghost" onClick={() => setStep((s) => s - 1)}>← Back</Button>
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
              <Card className="rounded-2xl border border-border/60 bg-card shadow-lg shadow-black/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl font-semibold tracking-tight">
                    Based on your feedback, here's a review others find helpful. Want to post this?
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">You only approve — no writing required.</p>
                </CardHeader>
                <CardContent className="space-y-5 pb-8">
                  <div className="rounded-xl bg-muted/60 p-5 text-base leading-relaxed text-foreground">
                    {review.text}
                  </div>
                  <Button asChild size="lg" className="w-full">
                    <a href={`https://www.google.com/search?q=${encodeURIComponent(venue.name)}+review`} target="_blank" rel="noopener noreferrer">
                      Post to Google →
                    </a>
                  </Button>
                  <Button variant="ghost" onClick={() => setDone(true)}>{claimRewardLabel}</Button>
                </CardContent>
              </Card>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>

      {done && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="mt-8 rounded-2xl border border-accent/30 bg-accent/10 p-6 text-center shadow-sm"
        >
          <p className="text-lg font-semibold text-foreground">{thanksTitle}</p>
          <p className="text-muted-foreground mt-1">{rewardCta ?? "Show this screen for your reward at the counter."}</p>
        </motion.div>
      )}
    </div>
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

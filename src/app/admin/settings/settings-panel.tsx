"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import type { Venue } from "@/types/venue";
import type { VenueSettings, CustomQuestion, MenuItem, ServiceItem, MenuCategory, ServiceCategory, QuestionType, ReplyTone, RatingStyle } from "@/types/venue";
import type { PlanSlug } from "@/types/tenant";
import { PLANS } from "@/types/tenant";
import { MenuManager } from "@/components/admin/menu-manager";
import { ServicesManager } from "@/components/admin/services-manager";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getGoogleStyleQuestionsForVenue } from "@/lib/question-templates";

const QUESTION_TYPES: { value: QuestionType; label: string }[] = [
  { value: "emoji", label: "Rating (1–5)" },
  { value: "yesNo", label: "Yes / No" },
  { value: "text", label: "Text" },
  { value: "singleChoice", label: "Single choice (tags)" },
  { value: "multiChoice", label: "Multi choice (tags)" },
];
const RATING_STYLES: { value: RatingStyle; label: string }[] = [
  { value: "star", label: "Stars" },
  { value: "emoji", label: "Sentiment icons" },
];
const SCORE_KEYS = ["overall", "cleanliness", "service", "foodQuality", "roomQuality", "value", "optionalText"];

const GOOGLE_REVIEW_LINK = "https://support.google.com/business/answer/2622994";
const GOOGLE_BUSINESS_LINK = "https://business.google.com/";

export function SettingsPanel({
  venueOptions,
  currentPlan = "free",
}: {
  venueOptions: Venue[];
  currentPlan?: PlanSlug;
}) {
  const venues = venueOptions;
  const [venueId, setVenueId] = useState(venues[0]?.id ?? "");
  const hasVenues = venues.length > 0;
  const [settings, setSettings] = useState<VenueSettings | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [reviewHistory, setReviewHistory] = useState("");
  const [customerContext, setCustomerContext] = useState("");
  const [generatingQuestions, setGeneratingQuestions] = useState(false);
  const [addingQuestion, setAddingQuestion] = useState(false);
  const [newQuestionType, setNewQuestionType] = useState<QuestionType>("emoji");
  const [newQuestionRatingStyle, setNewQuestionRatingStyle] = useState<RatingStyle>("star");
  const [newQuestionTitle, setNewQuestionTitle] = useState("");
  const [newQuestionKey, setNewQuestionKey] = useState("overall");
  const [newQuestionOptions, setNewQuestionOptions] = useState<string[]>([]);
  const [newQuestionOptionInput, setNewQuestionOptionInput] = useState("");
  const [newQuestionSeoHint, setNewQuestionSeoHint] = useState("");
  const [newQuestionMultiSelect, setNewQuestionMultiSelect] = useState(false);

  useEffect(() => {
    if (!venueId) return;
    setLoadError(null);
    fetch(`/api/admin/settings/${venueId}`)
      .then((r) => {
        if (!r.ok) {
          setLoadError(r.status === 404 ? "Venue not found." : "Failed to load settings.");
          return null;
        }
        return r.json();
      })
      .then((data) => {
        if (data && typeof data === "object" && "venueId" in data) {
          setSettings(data as VenueSettings);
          setLoadError(null);
        } else if (!data) {
          setSettings(null);
        } else {
          setSettings(null);
          setLoadError("Invalid settings response.");
        }
      })
      .catch(() => {
        setSettings(null);
        setLoadError("Failed to load settings.");
      });
  }, [venueId]);

  const save = async (patch: Partial<VenueSettings>) => {
    if (!venueId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/settings/${venueId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const updated = await res.json();
      if (res.ok && updated && typeof updated === "object" && "venueId" in updated) {
        setSettings(updated as VenueSettings);
      }
    } finally {
      setSaving(false);
    }
  };

  const generateQuestions = async () => {
    if (!venueId) return;
    setGeneratingQuestions(true);
    try {
      const res = await fetch(`/api/admin/settings/${venueId}/generate-questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewHistoryText: reviewHistory,
          venueType: venues.find((v) => v.id === venueId)?.type ?? "restaurant",
          customerContext: customerContext || undefined,
          defaultRatingStyle: settings?.defaultRatingStyle ?? "star",
        }),
      });
      const data = await res.json();
      if (data.questions?.length) {
        const ordered = [...data.questions].sort((a: CustomQuestion, b: CustomQuestion) => (a.order ?? 0) - (b.order ?? 0));
        await save({ customQuestions: ordered });
      }
    } finally {
      setGeneratingQuestions(false);
    }
  };

  if (!hasVenues) {
    return (
      <div className="admin-card rounded-2xl border bg-card p-10 text-center text-muted-foreground">
        <p className="font-medium">No venues yet</p>
        <p className="mt-1 text-sm">Add your first venue from the platform or contact support.</p>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="admin-card rounded-2xl border bg-card p-10 text-center text-sm">
        {loadError ? (
          <p className="text-destructive">{loadError}</p>
        ) : (
          <p className="text-muted-foreground">Loading settings…</p>
        )}
      </div>
    );
  }

  const venue = venues.find((v) => v.id === venueId);
  const uiText = settings.uiText ?? {};
  const customQuestions = settings.customQuestions ?? [];

  return (
    <div className="space-y-10">
      {/* Venue selector */}
      <Card className="admin-card border bg-card">
        <CardContent className="pt-6 pb-6">
          <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Location
          </Label>
          <select
            value={venueId}
            onChange={(e) => setVenueId(e.target.value)}
            className="mt-2 w-full max-w-xs rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none"
          >
            {venues.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      {/* Venue type: Show Menu / Show Services */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <Card className="admin-card overflow-hidden border bg-card">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold">What to show on QR scan</CardTitle>
            <CardDescription className="text-muted-foreground">
              Turn on Menu and/or Services depending on your location (restaurant, hotel, or both)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 p-4 transition-colors hover:bg-muted/50">
              <div>
                <Label className="text-sm font-medium">Show Menu</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  “Explore Menu” option for guests
                </p>
              </div>
              <Switch
                checked={settings.showMenu}
                onCheckedChange={(v) => save({ showMenu: v })}
              />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 p-4 transition-colors hover:bg-muted/50">
              <div>
                <Label className="text-sm font-medium">Show Services</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  “Explore Services” (spa, room service, etc.)
                </p>
              </div>
              <Switch
                checked={settings.showServices}
                onCheckedChange={(v) => save({ showServices: v })}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Integrations: Google Business Profile */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.03 }}
      >
        <Card className="admin-card overflow-hidden border bg-card">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold">Google Business Profile</CardTitle>
            <CardDescription className="text-muted-foreground">
              Add your review page link so guests can submit reviews from the feedback flow.{" "}
              <a href={GOOGLE_BUSINESS_LINK} target="_blank" rel="noopener noreferrer" className="text-primary underline hover:no-underline">Set up your profile</a>
              {" · "}
              <a href={GOOGLE_REVIEW_LINK} target="_blank" rel="noopener noreferrer" className="text-primary underline hover:no-underline">Get your review link</a>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Google review page URL</Label>
              <Input
                placeholder="e.g. https://search.google.com/local/writereview?placeid=ChIJ..."
                value={settings.googleReviewUrl ?? ""}
                onChange={(e) => save({ googleReviewUrl: e.target.value || undefined })}
                className="max-w-md rounded-xl border-input font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Used for the “Post to Google” button after feedback.
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              To sync Google reviews and post AI replies from the app, connect your account in the{" "}
              <Link href="/admin/reviews" className="text-primary underline hover:no-underline">Reviews</Link> page.
            </p>
            {saving && <p className="text-xs text-muted-foreground">Saving…</p>}
          </CardContent>
        </Card>
      </motion.div>

      {/* UI text */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <Card className="admin-card overflow-hidden border bg-card">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold">Guest-facing text</CardTitle>
            <CardDescription className="text-muted-foreground">
              Customize the reward and feedback copy guests see
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Reward / incentive line</Label>
              <Input
                placeholder="e.g. Win 10% off your next visit 🎁"
                value={uiText.rewardCta ?? ""}
                onChange={(e) =>
                  save({ uiText: { ...uiText, rewardCta: e.target.value } })
                }
                className="max-w-md rounded-xl border-input"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Welcome subtitle (under venue name)</Label>
              <Input
                placeholder="Scan to explore or share your experience"
                value={uiText.welcomeSubtitle ?? ""}
                onChange={(e) =>
                  save({ uiText: { ...uiText, welcomeSubtitle: e.target.value } })
                }
                className="max-w-md rounded-xl border-input"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Feedback card title</Label>
              <Input
                placeholder="Give Feedback & Win a Reward"
                value={uiText.feedbackCardTitle ?? ""}
                onChange={(e) =>
                  save({ uiText: { ...uiText, feedbackCardTitle: e.target.value } })
                }
                className="max-w-md rounded-xl border-input"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Claim reward button text</Label>
              <Input
                placeholder="I'm done — claim my reward"
                value={uiText.claimRewardLabel ?? ""}
                onChange={(e) =>
                  save({ uiText: { ...uiText, claimRewardLabel: e.target.value } })
                }
                className="max-w-md rounded-xl border-input"
              />
            </div>
            {saving && (
              <p className="text-xs text-muted-foreground">Saving…</p>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* AI reply tone & instructions (Google + WhatsApp) */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.06 }}
      >
        <Card className="admin-card overflow-hidden border bg-card">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold">AI reply style</CardTitle>
            <CardDescription className="text-muted-foreground">
              How AI should reply to Google reviews and WhatsApp (friendly, professional, offerable, etc.)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Reply tone</Label>
              <select
                value={settings.replyTone ?? "friendly"}
                onChange={(e) =>
                  save({ replyTone: (e.target.value || "friendly") as ReplyTone })
                }
                className="w-full max-w-md rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none"
              >
                <option value="friendly">Friendly</option>
                <option value="professional">Professional</option>
                <option value="apologetic">Apologetic</option>
                <option value="offerable">Offerable (mention offers)</option>
                <option value="luxury">Luxury (hotels)</option>
                <option value="casual">Casual (cafes)</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Custom instructions (optional)</Label>
              <Textarea
                placeholder="e.g. Always mention next visit discount. Keep under 2 sentences."
                value={settings.replyInstructions ?? ""}
                onChange={(e) =>
                  save({ replyInstructions: e.target.value || undefined })
                }
                className="min-h-[80px] resize-none rounded-xl border-input max-w-md"
                maxLength={500}
              />
            </div>
            {saving && (
              <p className="text-xs text-muted-foreground">Saving…</p>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Custom questions + AI */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="admin-card overflow-hidden border bg-card">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold">Feedback questions</CardTitle>
            <CardDescription className="text-muted-foreground">
              Add, remove, or reorder questions. Mix emoji, Yes/No, and text. Leave empty to use defaults.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-muted/20 p-3">
              <Label className="text-sm font-medium">Default rating display</Label>
              <span className="text-xs text-muted-foreground">For new and AI-generated rating questions</span>
              <select
                value={settings.defaultRatingStyle ?? "star"}
                onChange={(e) => save({ defaultRatingStyle: (e.target.value as RatingStyle) })}
                className="rounded-xl border border-input bg-background px-3 py-2 text-sm"
              >
                {RATING_STYLES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-3">
              <Label className="text-sm font-medium">Generate from AI (optional)</Label>
              <Textarea
                placeholder="Paste Google reviews — AI suggests questions"
                value={reviewHistory}
                onChange={(e) => setReviewHistory(e.target.value)}
                className="min-h-[88px] resize-none rounded-xl border-input"
                maxLength={8000}
              />
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Customer context (e.g. current order) — for personalized questions</Label>
                <Input
                  placeholder="e.g. Burger, Fries, Coke — AI can suggest “Did you enjoy the Burger?”"
                  value={customerContext}
                  onChange={(e) => setCustomerContext(e.target.value)}
                  className="max-w-md rounded-xl border-input"
                />
              </div>
              <Button
                variant="secondary"
                size="sm"
                className="rounded-lg"
                onClick={generateQuestions}
                disabled={generatingQuestions}
              >
                {generatingQuestions ? "Generating…" : "Suggest questions with AI"}
              </Button>
            </div>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Label className="text-sm font-medium">Your questions</Label>
                <span className="text-xs text-muted-foreground">
                  Add Google-style tag questions to get better SEO keywords (e.g. meal type, spend, group size).
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-lg"
                  onClick={async () => {
                    const venue = venues.find((v) => v.id === venueId);
                    if (!venue || !settings) return;
                    const template = getGoogleStyleQuestionsForVenue(venue.type, (settings.customQuestions?.length ?? 0));
                    await save({ customQuestions: [...(settings.customQuestions ?? []), ...template] });
                  }}
                >
                  + Add from template (Google-style for {venues.find((v) => v.id === venueId)?.type ?? "venue"})
                </Button>
              </div>
              <ul className="space-y-2 rounded-xl border border-border bg-muted/20 p-3">
                {customQuestions.length === 0 ? (
                  <li className="text-sm text-muted-foreground py-4 text-center">
                    No custom questions. Use “Suggest questions with AI” or add one below.
                  </li>
                ) : (
                  [...customQuestions]
                    .sort((a, b) => a.order - b.order)
                    .map((q, i) => (
                      <li
                        key={q.id}
                        className={cn(
                          "flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5 text-sm transition-colors hover:bg-muted/30"
                        )}
                      >
                        <span className="text-muted-foreground w-6 shrink-0 font-medium">{i + 1}.</span>
                        <Input
                          value={q.title}
                          onChange={(e) => {
                            const next = customQuestions.map((x) =>
                              x.id === q.id ? { ...x, title: e.target.value } : x
                            );
                            save({ customQuestions: next });
                          }}
                          className="min-w-[200px] flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0"
                        />
                        <Badge variant="secondary" className="shrink-0 rounded-md text-xs capitalize">
                          {q.type}
                        </Badge>
                        {(q.type === "singleChoice" || q.type === "multiChoice") && q.options?.length ? (
                          <span className="text-xs text-muted-foreground shrink-0">
                            {q.options.length} options{q.seoHint ? " · SEO" : ""}
                          </span>
                        ) : null}
                        {q.type === "emoji" && (
                          <select
                            value={q.ratingStyle ?? settings.defaultRatingStyle ?? "star"}
                            onChange={(e) => {
                              const next = customQuestions.map((x) =>
                                x.id === q.id ? { ...x, ratingStyle: (e.target.value as RatingStyle) } : x
                              );
                              save({ customQuestions: next });
                            }}
                            className="rounded-lg border border-input bg-background px-2 py-1 text-xs"
                          >
                            {RATING_STYLES.map((s) => (
                              <option key={s.value} value={s.value}>{s.label}</option>
                            ))}
                          </select>
                        )}
                        <span className="text-muted-foreground shrink-0 text-xs">{q.key}</span>
                        <div className="flex gap-0.5 shrink-0">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg"
                            onClick={() => {
                              const sorted = [...customQuestions].sort((a, b) => a.order - b.order);
                              if (i > 0) {
                                const prev = sorted[i - 1];
                                const curr = sorted[i];
                                const next = customQuestions.map((x) =>
                                  x.id === prev.id ? { ...x, order: curr.order } : x.id === curr.id ? { ...x, order: prev.order } : x
                                );
                                save({ customQuestions: next });
                              }
                            }}
                          >
                            ↑
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg"
                            onClick={() => {
                              const sorted = [...customQuestions].sort((a, b) => a.order - b.order);
                              if (i < sorted.length - 1) {
                                const curr = sorted[i];
                                const nextItem = sorted[i + 1];
                                const next = customQuestions.map((x) =>
                                  x.id === curr.id ? { ...x, order: nextItem.order } : x.id === nextItem.id ? { ...x, order: curr.order } : x
                                );
                                save({ customQuestions: next });
                              }
                            }}
                          >
                            ↓
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => {
                              const next = customQuestions.filter((x) => x.id !== q.id);
                              save({ customQuestions: next });
                            }}
                          >
                            ×
                          </Button>
                        </div>
                      </li>
                    ))
                )}
              </ul>
            </div>
            {!addingQuestion ? (
              <Button variant="outline" size="sm" className="rounded-lg" onClick={() => setAddingQuestion(true)}>
                + Add question
              </Button>
            ) : (
              <Card className="rounded-xl border border-border bg-muted/30 p-4 space-y-4">
                <Label className="text-sm font-medium">New question</Label>
                <div className="flex flex-wrap gap-2">
                  {QUESTION_TYPES.map((t) => (
                    <Button
                      key={t.value}
                      type="button"
                      variant={newQuestionType === t.value ? "default" : "outline"}
                      size="sm"
                      className="rounded-lg"
                      onClick={() => setNewQuestionType(t.value)}
                    >
                      {t.label}
                    </Button>
                  ))}
                </div>
                {newQuestionType === "emoji" && (
                  <div className="flex flex-wrap items-center gap-2">
                    <Label className="text-xs text-muted-foreground">Display as</Label>
                    {RATING_STYLES.map((s) => (
                      <Button
                        key={s.value}
                        type="button"
                        variant={newQuestionRatingStyle === s.value ? "secondary" : "ghost"}
                        size="sm"
                        className="rounded-lg"
                        onClick={() => setNewQuestionRatingStyle(s.value)}
                      >
                        {s.label}
                      </Button>
                    ))}
                  </div>
                )}
                {(newQuestionType === "singleChoice" || newQuestionType === "multiChoice") && (
                  <>
                    <div className="flex flex-wrap items-center gap-2">
                      <Label className="text-xs text-muted-foreground">Multi-select?</Label>
                      <Button
                        type="button"
                        variant={newQuestionMultiSelect ? "secondary" : "ghost"}
                        size="sm"
                        className="rounded-lg"
                        onClick={() => setNewQuestionMultiSelect(!newQuestionMultiSelect)}
                      >
                        {newQuestionMultiSelect ? "Yes (select all that apply)" : "No (single choice)"}
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Options (one per tag)</Label>
                      <div className="flex flex-wrap gap-2">
                        {newQuestionOptions.map((opt, i) => (
                          <Badge key={i} variant="secondary" className="rounded-lg gap-1 pr-1">
                            {opt}
                            <button
                              type="button"
                              className="ml-1 rounded hover:bg-muted"
                              onClick={() => setNewQuestionOptions((o) => o.filter((_, j) => j !== i))}
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                        <div className="flex gap-1">
                          <Input
                            placeholder="Add option"
                            value={newQuestionOptionInput}
                            onChange={(e) => setNewQuestionOptionInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                if (newQuestionOptionInput.trim()) {
                                  setNewQuestionOptions((o) => [...o, newQuestionOptionInput.trim()]);
                                  setNewQuestionOptionInput("");
                                }
                              }
                            }}
                            className="h-8 w-32 rounded-lg border-input text-sm"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 rounded-lg"
                            onClick={() => {
                              if (newQuestionOptionInput.trim()) {
                                setNewQuestionOptions((o) => [...o, newQuestionOptionInput.trim()]);
                                setNewQuestionOptionInput("");
                              }
                            }}
                          >
                            Add
                          </Button>
                        </div>
                      </div>
                    </div>
                    <Input
                      placeholder="SEO hint (admin only): e.g. Surfaces keywords: breakfast, brunch"
                      value={newQuestionSeoHint}
                      onChange={(e) => setNewQuestionSeoHint(e.target.value)}
                      className="rounded-xl border-input text-sm"
                    />
                  </>
                )}
                <Input
                  placeholder="Question text"
                  value={newQuestionTitle}
                  onChange={(e) => setNewQuestionTitle(e.target.value)}
                  className="rounded-xl border-input"
                />
                <div className="flex flex-wrap items-center gap-2">
                  <Label className="text-xs text-muted-foreground">Key (for AI / SEO):</Label>
                  <select
                    value={newQuestionKey}
                    onChange={(e) => setNewQuestionKey(e.target.value)}
                    className="rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none"
                  >
                    {SCORE_KEYS.map((k) => (
                      <option key={k} value={k}>{k}</option>
                    ))}
                    <option value="what_liked">what_liked</option>
                    <option value="would_recommend">would_recommend</option>
                    <option value="what_did_you_get">what_did_you_get</option>
                    <option value="what_did_you_use">what_did_you_use</option>
                    <option value="spend_per_person">spend_per_person</option>
                    <option value="wait_time">wait_time</option>
                    <option value="best_for">best_for</option>
                  </select>
                  <Button
                    size="sm"
                    className="rounded-lg"
                    onClick={() => {
                      if (!newQuestionTitle.trim()) return;
                      if ((newQuestionType === "singleChoice" || newQuestionType === "multiChoice") && newQuestionOptions.length === 0) return;
                      const newQ: CustomQuestion = {
                        id: "q-" + Date.now(),
                        title: newQuestionTitle.trim(),
                        type: newQuestionType,
                        key: newQuestionKey,
                        order: customQuestions.length,
                        ratingStyle: newQuestionType === "emoji" ? newQuestionRatingStyle : undefined,
                        placeholder: newQuestionType === "text" ? "Your answer..." : undefined,
                        yesNoLabels: newQuestionType === "yesNo" ? ["Yes", "No"] : undefined,
                        options: (newQuestionType === "singleChoice" || newQuestionType === "multiChoice") ? newQuestionOptions : undefined,
                        multiSelect: newQuestionType === "multiChoice" ? newQuestionMultiSelect : undefined,
                        seoHint: newQuestionSeoHint.trim() || undefined,
                      };
                      save({ customQuestions: [...customQuestions, newQ] });
                      setNewQuestionTitle("");
                      setNewQuestionKey("overall");
                      setNewQuestionOptions([]);
                      setNewQuestionSeoHint("");
                      setAddingQuestion(false);
                    }}
                  >
                    Add
                  </Button>
                  <Button variant="ghost" size="sm" className="rounded-lg" onClick={() => { setAddingQuestion(false); setNewQuestionTitle(""); setNewQuestionOptions([]); setNewQuestionSeoHint(""); }}>Cancel</Button>
                </div>
              </Card>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Menu (categories + items with images, price, description, enable/disable) */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <Card className="admin-card overflow-hidden border bg-card">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold">Menu</CardTitle>
            <CardDescription className="text-muted-foreground">
              Customize menu categories and items guests see when they tap “Explore Menu”
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MenuManager
              categories={settings.menuCategories ?? []}
              onSave={(menuCategories) => save({ menuCategories })}
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Services (categories + items with details) */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="admin-card overflow-hidden border bg-card">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold">Services</CardTitle>
            <CardDescription className="text-muted-foreground">
              Customize services guests see when they tap “Explore Services”
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ServicesManager
              categories={settings.serviceCategories ?? []}
              onSave={(serviceCategories) => save({ serviceCategories })}
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Billing & subscription (Razorpay placeholder) */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.22 }}
      >
        <Card className="admin-card overflow-hidden border bg-card">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold">Billing & subscription</CardTitle>
            <CardDescription className="text-muted-foreground">
              Manage your plan and payments. Subscriptions are powered by Razorpay.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-muted/30 p-4">
              <span className="text-sm font-medium text-foreground">Current plan</span>
              <Badge variant="secondary" className="rounded-lg">
                {PLANS[currentPlan]?.name ?? currentPlan}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {PLANS[currentPlan]?.features?.slice(0, 2).join(" · ") ?? ""}
              </span>
            </div>
            <div className="flex gap-2">
              <Button variant="default" size="sm" className="rounded-xl" asChild>
                <a href="/#pricing">Upgrade plan</a>
              </Button>
              <Button variant="outline" size="sm" className="rounded-xl" disabled>
                Manage subscription (coming soon)
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

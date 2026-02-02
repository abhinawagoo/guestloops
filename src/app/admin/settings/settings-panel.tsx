"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import type { Venue } from "@/types/venue";
import type { VenueSettings, CustomQuestion, MenuItem, ServiceItem, QuestionType, ReplyTone } from "@/types/venue";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const QUESTION_TYPES: { value: QuestionType; label: string }[] = [
  { value: "emoji", label: "Emoji (1–5)" },
  { value: "yesNo", label: "Yes / No" },
  { value: "text", label: "Text" },
];
const SCORE_KEYS = ["overall", "cleanliness", "service", "foodQuality", "roomQuality", "value", "optionalText"];

export function SettingsPanel({
  venueOptions,
}: {
  venueOptions: Venue[];
}) {
  const venues = venueOptions;
  const [venueId, setVenueId] = useState(venues[0]?.id ?? "");
  const hasVenues = venues.length > 0;
  const [settings, setSettings] = useState<VenueSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [reviewHistory, setReviewHistory] = useState("");
  const [customerContext, setCustomerContext] = useState("");
  const [generatingQuestions, setGeneratingQuestions] = useState(false);
  const [addingQuestion, setAddingQuestion] = useState(false);
  const [newQuestionType, setNewQuestionType] = useState<QuestionType>("emoji");
  const [newQuestionTitle, setNewQuestionTitle] = useState("");
  const [newQuestionKey, setNewQuestionKey] = useState("overall");

  useEffect(() => {
    if (!venueId) return;
    fetch(`/api/admin/settings/${venueId}`)
      .then((r) => r.json())
      .then(setSettings)
      .catch(() => setSettings(null));
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
      setSettings(updated);
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
      <div className="admin-card rounded-2xl border bg-card p-10 text-center text-muted-foreground text-sm">
        Loading settings…
      </div>
    );
  }

  const venue = venues.find((v) => v.id === venueId);

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
                value={settings.uiText.rewardCta ?? ""}
                onChange={(e) =>
                  save({ uiText: { ...settings.uiText, rewardCta: e.target.value } })
                }
                className="max-w-md rounded-xl border-input"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Welcome subtitle (under venue name)</Label>
              <Input
                placeholder="Scan to explore or share your experience"
                value={settings.uiText.welcomeSubtitle ?? ""}
                onChange={(e) =>
                  save({ uiText: { ...settings.uiText, welcomeSubtitle: e.target.value } })
                }
                className="max-w-md rounded-xl border-input"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Feedback card title</Label>
              <Input
                placeholder="Give Feedback & Win a Reward"
                value={settings.uiText.feedbackCardTitle ?? ""}
                onChange={(e) =>
                  save({ uiText: { ...settings.uiText, feedbackCardTitle: e.target.value } })
                }
                className="max-w-md rounded-xl border-input"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Claim reward button text</Label>
              <Input
                placeholder="I'm done — claim my reward"
                value={settings.uiText.claimRewardLabel ?? ""}
                onChange={(e) =>
                  save({ uiText: { ...settings.uiText, claimRewardLabel: e.target.value } })
                }
                className="max-w-md rounded-xl border-input"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Google review page URL</Label>
              <Input
                placeholder="e.g. https://search.google.com/local/writereview?placeid=ChIJ..."
                value={settings.googleReviewUrl ?? ""}
                onChange={(e) => save({ googleReviewUrl: e.target.value || undefined })}
                className="max-w-md rounded-xl border-input"
              />
              <p className="text-xs text-muted-foreground">
                Paste your Google review / writereview link. Used for the &quot;Post to Google&quot; button after feedback.
              </p>
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
              <Label className="text-sm font-medium">Your questions</Label>
              <ul className="space-y-2 rounded-xl border border-border bg-muted/20 p-3">
                {(settings.customQuestions.length ? settings.customQuestions : []).length === 0 ? (
                  <li className="text-sm text-muted-foreground py-4 text-center">
                    No custom questions. Use “Suggest questions with AI” or add one below.
                  </li>
                ) : (
                  [...settings.customQuestions]
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
                            const next = settings.customQuestions.map((x) =>
                              x.id === q.id ? { ...x, title: e.target.value } : x
                            );
                            save({ customQuestions: next });
                          }}
                          className="min-w-[200px] flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0"
                        />
                        <Badge variant="secondary" className="shrink-0 rounded-md text-xs capitalize">
                          {q.type}
                        </Badge>
                        <span className="text-muted-foreground shrink-0 text-xs">{q.key}</span>
                        <div className="flex gap-0.5 shrink-0">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg"
                            onClick={() => {
                              const sorted = [...settings.customQuestions].sort((a, b) => a.order - b.order);
                              if (i > 0) {
                                const prev = sorted[i - 1];
                                const curr = sorted[i];
                                const next = settings.customQuestions.map((x) =>
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
                              const sorted = [...settings.customQuestions].sort((a, b) => a.order - b.order);
                              if (i < sorted.length - 1) {
                                const curr = sorted[i];
                                const nextItem = sorted[i + 1];
                                const next = settings.customQuestions.map((x) =>
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
                              const next = settings.customQuestions.filter((x) => x.id !== q.id);
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
                <Input
                  placeholder="Question text"
                  value={newQuestionTitle}
                  onChange={(e) => setNewQuestionTitle(e.target.value)}
                  className="rounded-xl border-input"
                />
                <div className="flex flex-wrap items-center gap-2">
                  <Label className="text-xs text-muted-foreground">Key (for AI):</Label>
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
                  </select>
                  <Button
                    size="sm"
                    className="rounded-lg"
                    onClick={() => {
                      if (!newQuestionTitle.trim()) return;
                      const newQ: CustomQuestion = {
                        id: "q-" + Date.now(),
                        title: newQuestionTitle.trim(),
                        type: newQuestionType,
                        key: newQuestionKey,
                        order: settings.customQuestions.length,
                        placeholder: newQuestionType === "text" ? "Your answer..." : undefined,
                        yesNoLabels: newQuestionType === "yesNo" ? ["Yes", "No"] : undefined,
                      };
                      save({ customQuestions: [...settings.customQuestions, newQ] });
                      setNewQuestionTitle("");
                      setNewQuestionKey("overall");
                      setAddingQuestion(false);
                    }}
                  >
                    Add
                  </Button>
                  <Button variant="ghost" size="sm" className="rounded-lg" onClick={() => { setAddingQuestion(false); setNewQuestionTitle(""); }}>Cancel</Button>
                </div>
              </Card>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Menu items (if showMenu) */}
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
          <CardContent className="space-y-4">
            {settings.menuItems.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">
                No menu items yet. Add categories and items below (or leave empty to use placeholder).
              </p>
            ) : (
              <ul className="space-y-2">
                {settings.menuItems
                  .sort((a, b) => a.order - b.order)
                  .map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center justify-between rounded-xl border border-border bg-muted/20 p-3 text-sm transition-colors hover:bg-muted/40"
                    >
                      <span className="font-medium">{item.name}</span>
                      <Badge variant="outline" className="rounded-md">{item.category}</Badge>
                    </li>
                  ))}
              </ul>
            )}
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg"
              onClick={() => {
                const newItem: MenuItem = {
                  id: "menu-" + Date.now(),
                  category: "Mains",
                  name: "New item",
                  order: settings.menuItems.length,
                };
                save({ menuItems: [...settings.menuItems, newItem] });
              }}
            >
              Add menu item
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Service items (if showServices) */}
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
          <CardContent className="space-y-4">
            {settings.serviceItems.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">
                No services yet. Add below (or leave empty to use placeholder).
              </p>
            ) : (
              <ul className="space-y-2">
                {settings.serviceItems
                  .sort((a, b) => a.order - b.order)
                  .map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center justify-between rounded-xl border border-border bg-muted/20 p-3 text-sm transition-colors hover:bg-muted/40"
                    >
                      <span className="font-medium">{item.name}</span>
                    </li>
                  ))}
              </ul>
            )}
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg"
              onClick={() => {
                const newItem: ServiceItem = {
                  id: "svc-" + Date.now(),
                  name: "New service",
                  order: settings.serviceItems.length,
                };
                save({ serviceItems: [...settings.serviceItems, newItem] });
              }}
            >
              Add service
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

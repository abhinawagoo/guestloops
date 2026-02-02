"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronRight } from "lucide-react";

type Submission = {
  id: string;
  venueId: string;
  venueName: string;
  scores: Record<string, number>;
  textAnswers: Record<string, string>;
  yesNoAnswers?: Record<string, boolean>;
  optionalText?: string;
  generatedReviewText?: string;
  reviewOutcome?: string;
  createdAt: string;
};

// Demo data — replace with Supabase/API
const ASPECT_SCORES = [
  { aspect: "Cleanliness", score: 78, color: "green" },
  { aspect: "Service", score: 42, color: "orange" },
  { aspect: "Food Quality", score: 61, color: "green" },
  { aspect: "Value", score: 35, color: "red" },
] as const;

const AI_INSIGHTS = [
  "Customers love food quality but complain about slow service during dinner hours (7–9 PM).",
  "Rooms with balcony receive 32% higher ratings.",
  "Repeat visitors rate service 18% higher than first-time guests.",
];

const colorClasses = {
  green: "bg-emerald-500",
  orange: "bg-amber-500",
  red: "bg-red-500",
};

export function AdminDashboard() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/submissions?limit=10")
      .then((r) => r.json())
      .then((data) => setSubmissions(data.submissions ?? []))
      .catch(() => setSubmissions([]))
      .finally(() => setLoadingSubmissions(false));
  }, []);

  return (
    <div className="space-y-8">
      <Card className="admin-card border bg-card">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold">Recent feedback</CardTitle>
          <p className="text-sm text-muted-foreground">
            Latest submissions from your QR feedback flow
          </p>
        </CardHeader>
        <CardContent>
          {loadingSubmissions ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : submissions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No feedback yet. Share your QR so guests can leave feedback.
            </p>
          ) : (
            <ul className="space-y-3">
              {submissions.map((sub) => {
                const isExpanded = expandedId === sub.id;
                return (
                  <li
                    key={sub.id}
                    className="rounded-xl border border-border bg-muted/20 overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : sub.id)}
                      className="flex flex-wrap items-center justify-between gap-2 w-full px-4 py-3 text-sm text-left hover:bg-muted/40 transition-colors"
                    >
                      <div className="min-w-0 flex-1 flex items-center gap-2">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                        )}
                        <span className="font-medium">{sub.venueName}</span>
                        <span className="text-muted-foreground">·</span>
                        <span className="text-muted-foreground">
                          {sub.reviewOutcome === "google_redirect" ? "→ Google" : "Private"}
                        </span>
                        {sub.scores?.overall != null && (
                          <span className="text-muted-foreground">
                            {sub.scores.overall}/5
                          </span>
                        )}
                        <span className="text-muted-foreground">
                          {new Date(sub.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="shrink-0">
                        {sub.generatedReviewText && (
                          <span className="line-clamp-1 max-w-[200px] text-muted-foreground">
                            {sub.generatedReviewText}
                          </span>
                        )}
                      </div>
                    </button>
                    {isExpanded && (
                      <div className="border-t border-border bg-background/80 px-4 py-4 text-sm space-y-4">
                        <div className="grid gap-2 sm:grid-cols-2">
                          {Object.keys(sub.scores ?? {}).length > 0 && (
                            <div>
                              <p className="font-medium text-muted-foreground mb-1">Scores</p>
                              <div className="flex flex-wrap gap-2">
                                {Object.entries(sub.scores ?? {}).map(([k, v]) => (
                                  <span key={k} className="rounded-md bg-muted px-2 py-0.5">
                                    {k}: {v}/5
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {Object.keys(sub.yesNoAnswers ?? {}).length > 0 && (
                            <div>
                              <p className="font-medium text-muted-foreground mb-1">Yes/No</p>
                              <div className="flex flex-wrap gap-2">
                                {Object.entries(sub.yesNoAnswers ?? {}).map(([k, v]) => (
                                  <span key={k} className="rounded-md bg-muted px-2 py-0.5">
                                    {k}: {v ? "Yes" : "No"}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        {Object.keys(sub.textAnswers ?? {}).length > 0 && (
                          <div>
                            <p className="font-medium text-muted-foreground mb-1">Text answers</p>
                            <ul className="space-y-1">
                              {Object.entries(sub.textAnswers ?? {}).map(([k, v]) => (
                                <li key={k}>
                                  <span className="text-muted-foreground">{k}:</span> {v}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {sub.optionalText && (
                          <div>
                            <p className="font-medium text-muted-foreground mb-1">Optional note</p>
                            <p className="text-foreground">{sub.optionalText}</p>
                          </div>
                        )}
                        {sub.generatedReviewText && (
                          <div>
                            <p className="font-medium text-muted-foreground mb-1">Generated review (for Google)</p>
                            <p className="text-foreground rounded-lg bg-muted/60 p-3">{sub.generatedReviewText}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          {submissions.length > 0 && (
            <Link href="/admin/reviews" className="mt-4 inline-block">
              <Button variant="secondary" size="sm">
                View all in Reviews →
              </Button>
            </Link>
          )}
        </CardContent>
      </Card>

      <Card className="admin-card border bg-card">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold">Aspect scores (last 30 days)</CardTitle>
          <p className="text-sm text-muted-foreground">
            Click an aspect to drill down
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 sm:grid-cols-2">
            {ASPECT_SCORES.map(({ aspect, score, color }) => (
              <div key={aspect} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{aspect}</span>
                  <span className="text-muted-foreground">{score}%</span>
                </div>
                <Progress
                  value={score}
                  className={cn(
                    "h-3 rounded-full [&_[data-slot=progress-indicator]]:rounded-full [&_[data-slot=progress-indicator]]:bg-current",
                    color === "green" && "[&_[data-slot=progress-indicator]]:bg-emerald-500",
                    color === "orange" && "[&_[data-slot=progress-indicator]]:bg-amber-500",
                    color === "red" && "[&_[data-slot=progress-indicator]]:bg-red-500"
                  )}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="admin-card border bg-card">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold">AI insights</CardTitle>
          <p className="text-sm text-muted-foreground">
            Plain English — no analytics noise
          </p>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {AI_INSIGHTS.map((insight, i) => (
              <li
                key={i}
                className="flex gap-3 rounded-xl border border-border bg-muted/20 p-4 text-sm transition-colors hover:bg-muted/40"
              >
                <Badge variant="secondary" className="shrink-0 rounded-md">
                  Insight
                </Badge>
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="rounded-xl bg-muted/50 p-1">
          <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">Overview</TabsTrigger>
          <TabsTrigger value="reviews" className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">Review management</TabsTrigger>
          <TabsTrigger value="retention" className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">Retention</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-4">
          <Card className="admin-card border bg-card">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                Scan → completion target: 65–80%. Completion → Google review:
                50–70%. Connect Supabase to see live metrics.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="reviews" className="mt-4">
          <Card className="admin-card border bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold">Google review management</CardTitle>
              <p className="text-sm text-muted-foreground">
                Auto-reply modes: Auto (AI), Guided (tone), Manual. Reply styles:
                Professional, Warm, Apologetic, Luxury, Casual.
              </p>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Connect Google Business Profile API to enable auto-reply and
                reply templates.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="retention" className="mt-4">
          <Card className="admin-card border bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold">Customer retention</CardTitle>
              <p className="text-sm text-muted-foreground">
                Guests who rated service low → apology coupon. Personalized
                offers, WhatsApp/SMS (later).
              </p>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Collect phone + visit context in feedback flow to unlock
                campaigns.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

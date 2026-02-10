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
import { FeedbackQRCard } from "@/components/admin/feedback-qr-card";

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

type AspectScore = { aspect: string; key: string; score: number; count?: number };

type DashboardStats = {
  aspectScores: AspectScore[];
  totalSubmissions: number;
  googleRedirectCount: number;
  completionToGooglePercent: number;
  days: number;
};

type GrowthIntelligence = {
  localGrowthScore: number;
  breakdown: {
    review_velocity_score: number;
    avg_rating_score: number;
    reply_rate_score: number;
    sentiment_strength_score: number;
    keyword_coverage_score: number;
    trend_improvement_score: number;
  };
  strengths: string[];
  weak_areas: string[];
  ai_recommendations: string[];
  seo_keyword_gaps: string[];
  days: number;
};

function progressColor(score: number): "green" | "orange" | "red" {
  if (score >= 60) return "green";
  if (score >= 40) return "orange";
  return "red";
}

export function AdminDashboard() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [growth, setGrowth] = useState<GrowthIntelligence | null>(null);
  const [loadingGrowth, setLoadingGrowth] = useState(true);

  useEffect(() => {
    fetch("/api/admin/submissions?limit=10")
      .then((r) => r.json())
      .then((data) => setSubmissions(data.submissions ?? []))
      .catch(() => setSubmissions([]))
      .finally(() => setLoadingSubmissions(false));
  }, []);

  useEffect(() => {
    fetch("/api/admin/dashboard-stats?days=30")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) return;
        setStats({
          aspectScores: data.aspectScores ?? [],
          totalSubmissions: data.totalSubmissions ?? 0,
          googleRedirectCount: data.googleRedirectCount ?? 0,
          completionToGooglePercent: data.completionToGooglePercent ?? 0,
          days: data.days ?? 30,
        });
      })
      .catch(() => setStats(null))
      .finally(() => setLoadingStats(false));
  }, []);

  useEffect(() => {
    fetch("/api/admin/growth-intelligence?days=30")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) return;
        setGrowth({
          localGrowthScore: data.localGrowthScore ?? 0,
          breakdown: data.breakdown ?? {},
          strengths: data.strengths ?? [],
          weak_areas: data.weak_areas ?? [],
          ai_recommendations: data.ai_recommendations ?? [],
          seo_keyword_gaps: data.seo_keyword_gaps ?? [],
          days: data.days ?? 30,
        });
      })
      .catch(() => setGrowth(null))
      .finally(() => setLoadingGrowth(false));
  }, []);

  return (
    <div className="space-y-8">
      <FeedbackQRCard />
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
          {loadingStats ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : !stats || stats.aspectScores.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No feedback in the last 30 days. Share your QR so guests can leave feedback.
            </p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2">
              {stats.aspectScores.map(({ aspect, score }) => {
                const color = progressColor(score);
                return (
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
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="admin-card border bg-card">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold">Growth Intelligence</CardTitle>
          <p className="text-sm text-muted-foreground">
            Local Growth Score and AI recommendations per business
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {loadingGrowth ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : growth ? (
            <>
              <div className="flex flex-wrap items-baseline gap-4">
                <div className="rounded-xl border border-border bg-muted/30 p-4 min-w-[120px] text-center">
                  <p className="text-3xl font-bold">{growth.localGrowthScore}</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Local Growth Score</p>
                </div>
                <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
                  {growth.breakdown && (
                    <>
                      <div><span className="text-muted-foreground">Velocity</span> {growth.breakdown.review_velocity_score ?? 0}%</div>
                      <div><span className="text-muted-foreground">Rating</span> {growth.breakdown.avg_rating_score ?? 0}%</div>
                      <div><span className="text-muted-foreground">Reply rate</span> {growth.breakdown.reply_rate_score ?? 0}%</div>
                      <div><span className="text-muted-foreground">Sentiment</span> {growth.breakdown.sentiment_strength_score ?? 0}%</div>
                      <div><span className="text-muted-foreground">Keywords</span> {growth.breakdown.keyword_coverage_score ?? 0}%</div>
                      <div><span className="text-muted-foreground">Trend</span> {growth.breakdown.trend_improvement_score ?? 0}%</div>
                    </>
                  )}
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {growth.strengths.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Strengths</p>
                    <ul className="text-sm space-y-1">
                      {growth.strengths.map((s, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="text-emerald-600 dark:text-emerald-400">+</span>
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {growth.weak_areas.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Areas to improve</p>
                    <ul className="text-sm space-y-1">
                      {growth.weak_areas.map((w, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="text-amber-600 dark:text-amber-400">•</span>
                          {w}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              {growth.ai_recommendations.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">AI recommendations</p>
                  <ul className="text-sm space-y-2">
                    {growth.ai_recommendations.map((r, i) => (
                      <li key={i} className="rounded-lg bg-muted/30 px-3 py-2">{r}</li>
                    ))}
                  </ul>
                </div>
              )}
              {growth.seo_keyword_gaps.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">SEO keyword gaps</p>
                  <ul className="text-sm space-y-1">
                    {growth.seo_keyword_gaps.map((g, i) => (
                      <li key={i} className="text-muted-foreground">→ {g}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground rounded-xl border border-border bg-muted/20 p-4">
              Connect Google Business Profile and collect feedback to see your Local Growth Score and recommendations.
            </p>
          )}
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
            <CardContent className="pt-6 space-y-4">
              {stats && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border border-border bg-muted/20 p-4">
                    <p className="text-2xl font-semibold">{stats.totalSubmissions}</p>
                    <p className="text-sm text-muted-foreground">Feedback (last 30 days)</p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/20 p-4">
                    <p className="text-2xl font-semibold">{stats.completionToGooglePercent}%</p>
                    <p className="text-sm text-muted-foreground">Redirected to Google</p>
                  </div>
                </div>
              )}
              <p className="text-sm text-muted-foreground">
                Target: completion → Google review 50–70%.{" "}
                <Link href="/admin/reviews" className="underline text-foreground">
                  View all feedback →
                </Link>
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="reviews" className="mt-4">
          <Card className="admin-card border bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold">Google review management</CardTitle>
              <p className="text-sm text-muted-foreground">
                Reply styles: Professional, Warm, Apologetic, Luxury, Casual. Configure in Settings.
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/admin/reviews">
                <Button variant="secondary" size="sm">Reviews & AI replies →</Button>
              </Link>
              <Link href="/admin/settings">
                <Button variant="outline" size="sm">Settings (Google review URL, tone) →</Button>
              </Link>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="retention" className="mt-4">
          <Card className="admin-card border bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold">Customer retention</CardTitle>
              <p className="text-sm text-muted-foreground">
                Personalized offers and follow-up (WhatsApp/SMS) — coming soon.
              </p>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Collect phone + visit context in your feedback flow to unlock campaigns later.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import type { Venue } from "@/types/venue";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Submission = {
  id: string;
  venueId: string;
  scores: Record<string, number>;
  textAnswers: Record<string, string>;
  generatedReviewText?: string;
  reviewOutcome?: string;
  createdAt: string;
};

export function ReviewsPanel({ venueOptions }: { venueOptions: Venue[] }) {
  const venues = venueOptions;
  const [venueId, setVenueId] = useState(venues[0]?.id ?? "");
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(false);
  const [generatingReplyFor, setGeneratingReplyFor] = useState<string | null>(null);
  const [replyFor, setReplyFor] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!venueId) return;
    setLoading(true);
    fetch(`/api/admin/reviews?venueId=${encodeURIComponent(venueId)}`)
      .then((r) => r.json())
      .then((data) => {
        setSubmissions(data.submissions ?? []);
      })
      .catch(() => setSubmissions([]))
      .finally(() => setLoading(false));
  }, [venueId]);

  const generateReply = async (sub: Submission) => {
    const reviewText = sub.generatedReviewText ?? (Object.values(sub.textAnswers).join(" ") || "Good experience.");
    const reviewRating = typeof sub.scores?.overall === "number" ? sub.scores.overall : 3;
    setGeneratingReplyFor(sub.id);
    try {
      const res = await fetch("/api/admin/reviews/generate-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          venueId: sub.venueId,
          reviewText,
          reviewRating,
        }),
      });
      const data = await res.json();
      if (data.reply) setReplyFor((prev) => ({ ...prev, [sub.id]: data.reply }));
    } finally {
      setGeneratingReplyFor(null);
    }
  };

  const copyReply = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (venues.length === 0) {
    return (
      <Card className="admin-card border bg-card">
        <CardContent className="py-10 text-center text-muted-foreground">
          <p className="font-medium">No venues yet</p>
          <p className="mt-1 text-sm">Add a venue in Settings to see feedback and reviews.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="admin-card border bg-card">
        <CardContent className="pt-6">
          <label className="text-sm font-medium text-foreground">Location</label>
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

      <Card className="admin-card border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">Feedback & generated reviews</CardTitle>
          <CardDescription className="text-muted-foreground">
            Submissions from your QR feedback flow. Generate AI replies using your chosen tone (Settings → AI reply style).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p>
          ) : submissions.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No feedback yet for this venue. Share your QR so guests can leave feedback and get AI-generated Google reviews.
            </p>
          ) : (
            <ul className="space-y-4">
              {submissions.map((sub) => (
                <motion.li
                  key={sub.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border border-border bg-muted/20 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {sub.generatedReviewText ?? "Private feedback (no review text)"}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {sub.reviewOutcome && (
                          <Badge variant="secondary" className="text-xs">
                            {sub.reviewOutcome === "google_redirect" ? "→ Google" : "Private"}
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {sub.scores?.overall != null ? `${sub.scores.overall}/5` : ""} · {new Date(sub.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="shrink-0"
                        disabled={generatingReplyFor === sub.id}
                        onClick={() => generateReply(sub)}
                      >
                        {generatingReplyFor === sub.id ? "Generating…" : "Generate AI reply"}
                      </Button>
                      {replyFor[sub.id] && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyReply(sub.id, replyFor[sub.id])}
                        >
                          {copiedId === sub.id ? "Copied" : "Copy reply"}
                        </Button>
                      )}
                    </div>
                  </div>
                  {replyFor[sub.id] && (
                    <div className="mt-3 rounded-lg border border-border bg-card p-3 text-sm text-muted-foreground">
                      {replyFor[sub.id]}
                    </div>
                  )}
                </motion.li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="admin-card border border-primary/20 bg-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Google Business Profile</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Connect Google Business Profile API to fetch live Google reviews and post replies from here. Set your reply tone in Settings → AI reply style.
        </CardContent>
      </Card>
    </div>
  );
}

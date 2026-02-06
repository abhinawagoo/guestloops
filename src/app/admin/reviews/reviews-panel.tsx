"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import type { Venue } from "@/types/venue";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

type Submission = {
  id: string;
  venueId: string;
  scores: Record<string, number>;
  textAnswers: Record<string, string>;
  generatedReviewText?: string;
  reviewOutcome?: string;
  createdAt: string;
};

type GoogleReview = {
  id: string;
  venueId: string;
  gbpReviewName: string;
  reviewerDisplayName: string | null;
  starRating: number | null;
  comment: string | null;
  reviewReply: string | null;
  createdAt: string;
  updatedAt: string;
  repliedAt: string | null;
  sentiment: string | null;
  topics: string[];
  trendTags: string[];
};

export function ReviewsPanel({ venueOptions }: { venueOptions: Venue[] }) {
  const venues = venueOptions;
  const [venueId, setVenueId] = useState(venues[0]?.id ?? "");
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [googleReviews, setGoogleReviews] = useState<GoogleReview[]>([]);
  const [loading, setLoading] = useState(false);
  const [gbpConnected, setGbpConnected] = useState(false);
  const [venueLinkedToGbp, setVenueLinkedToGbp] = useState(false);
  const [generatingReplyFor, setGeneratingReplyFor] = useState<string | null>(null);
  const [replyFor, setReplyFor] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [postingReplyFor, setPostingReplyFor] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<{ accountId: string; accountName?: string }[]>([]);
  const [locations, setLocations] = useState<{ locationId: string; title?: string }[]>([]);
  const [linkFlow, setLinkFlow] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [selectedLocationId, setSelectedLocationId] = useState("");
  const [linkLocationName, setLinkLocationName] = useState("");
  const [linking, setLinking] = useState(false);

  useEffect(() => {
    if (!venueId) return;
    setLoading(true);
    Promise.all([
      fetch(`/api/admin/reviews?venueId=${encodeURIComponent(venueId)}`).then((r) => r.json()),
      fetch(`/api/admin/google/status`).then((r) => r.json()),
      fetch(`/api/admin/google/reviews?venueId=${encodeURIComponent(venueId)}`).then((r) => r.json()),
    ])
      .then(([reviewsData, statusData, gReviewsData]) => {
        setSubmissions(reviewsData.submissions ?? []);
        setGbpConnected(!!statusData.connected);
        setVenueLinkedToGbp((statusData.venuesWithGbp ?? []).includes(venueId));
        setGoogleReviews(gReviewsData.googleReviews ?? []);
      })
      .catch(() => {
        setSubmissions([]);
        setGoogleReviews([]);
      })
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
        body: JSON.stringify({ venueId: sub.venueId, reviewText, reviewRating }),
      });
      const data = await res.json();
      if (data.reply) setReplyFor((prev) => ({ ...prev, [sub.id]: data.reply }));
    } finally {
      setGeneratingReplyFor(null);
    }
  };

  const generateReplyForGoogle = async (gr: GoogleReview) => {
    const reviewText = gr.comment ?? "No comment";
    const reviewRating = gr.starRating ?? 3;
    setGeneratingReplyFor(gr.id);
    try {
      const res = await fetch("/api/admin/reviews/generate-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ venueId: gr.venueId, reviewText, reviewRating }),
      });
      const data = await res.json();
      if (data.reply) setReplyFor((prev) => ({ ...prev, [gr.id]: data.reply }));
    } finally {
      setGeneratingReplyFor(null);
    }
  };

  const copyReply = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const syncReviews = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/admin/google/sync-reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ venueId }),
      });
      const data = await res.json();
      if (data.ok) {
        const r = await fetch(`/api/admin/google/reviews?venueId=${encodeURIComponent(venueId)}`);
        const j = await r.json();
        setGoogleReviews(j.googleReviews ?? []);
      }
    } finally {
      setSyncing(false);
    }
  };

  const postReply = async (googleReviewId: string, replyText: string) => {
    setPostingReplyFor(googleReviewId);
    try {
      const res = await fetch("/api/admin/reviews/post-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ venueId, googleReviewId, replyText }),
      });
      const data = await res.json();
      if (data.ok) {
        setReplyFor((prev) => {
          const next = { ...prev };
          delete next[googleReviewId];
          return next;
        });
        const r = await fetch(`/api/admin/google/reviews?venueId=${encodeURIComponent(venueId)}`);
        const j = await r.json();
        setGoogleReviews(j.googleReviews ?? []);
      }
    } finally {
      setPostingReplyFor(null);
    }
  };

  const loadAccounts = () => {
    fetch("/api/admin/google/accounts")
      .then((r) => r.json())
      .then((data) => setAccounts(data.accounts ?? []))
      .catch(() => setAccounts([]));
  };

  useEffect(() => {
    if (!selectedAccountId) {
      setLocations([]);
      return;
    }
    fetch(`/api/admin/google/locations?accountId=${encodeURIComponent(selectedAccountId)}`)
      .then((r) => r.json())
      .then((data) => setLocations(data.locations ?? []))
      .catch(() => setLocations([]));
  }, [selectedAccountId]);

  const linkVenue = async () => {
    if (!selectedAccountId || !selectedLocationId) return;
    setLinking(true);
    try {
      const loc = locations.find((l) => l.locationId === selectedLocationId);
      await fetch("/api/admin/google/link-venue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          venueId,
          gbpAccountId: selectedAccountId,
          gbpLocationId: selectedLocationId,
          gbpLocationName: (loc?.title ?? linkLocationName) || undefined,
        }),
      });
      setVenueLinkedToGbp(true);
      setLinkFlow(false);
    } finally {
      setLinking(false);
    }
  };

  const connectUrl = typeof window !== "undefined"
    ? `${window.location.origin}/api/google/oauth/authorize?venueId=${encodeURIComponent(venueId)}`
    : "#";

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

      {/* Google Business Profile: Connect & Link */}
      <Card className="admin-card border border-primary/20 bg-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Google Business Profile</CardTitle>
          <CardDescription className="text-muted-foreground">
            Connect to sync Google reviews and post AI-generated replies after approval.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!gbpConnected ? (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Connect your Google account to manage reviews.</p>
              <Button asChild size="sm">
                <a href={connectUrl}>Connect Google Business Profile</a>
              </Button>
            </div>
          ) : !venueLinkedToGbp ? (
            <div className="space-y-3">
              {!linkFlow ? (
                <>
                  <p className="text-sm text-muted-foreground">Link this venue to a Google Business location.</p>
                  <Button size="sm" variant="secondary" onClick={() => { setLinkFlow(true); loadAccounts(); }}>
                    Link venue to GBP location
                  </Button>
                </>
              ) : (
                <div className="rounded-lg border border-border bg-card p-4 space-y-3">
                  <label className="text-sm font-medium">Account</label>
                  <select
                    value={selectedAccountId}
                    onChange={(e) => setSelectedAccountId(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Select account</option>
                    {accounts.map((a) => (
                      <option key={a.accountId} value={a.accountId}>{a.accountName ?? a.accountId}</option>
                    ))}
                  </select>
                  <label className="text-sm font-medium">Location</label>
                  <select
                    value={selectedLocationId}
                    onChange={(e) => {
                      const loc = locations.find((l) => l.locationId === e.target.value);
                      setSelectedLocationId(e.target.value);
                      setLinkLocationName(loc?.title ?? "");
                    }}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Select location</option>
                    {locations.map((l) => (
                      <option key={l.locationId} value={l.locationId}>{l.title ?? l.locationId}</option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <Button size="sm" disabled={!selectedLocationId || linking} onClick={linkVenue}>
                      {linking ? "Linking…" : "Link venue"}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setLinkFlow(false)}>Cancel</Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Venue linked. Sync to fetch latest Google reviews.</p>
              <Button size="sm" variant="secondary" disabled={syncing} onClick={syncReviews}>
                {syncing ? "Syncing…" : "Sync Google reviews"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Google reviews (synced) */}
      {venueLinkedToGbp && (
        <Card className="admin-card border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">Google reviews (synced)</CardTitle>
            <CardDescription className="text-muted-foreground">
              AI sentiment & topics. Generate reply → edit if needed → Approve & post.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {googleReviews.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No Google reviews synced yet. Click &quot;Sync Google reviews&quot; above.
              </p>
            ) : (
              <ul className="space-y-4">
                {googleReviews.map((gr) => (
                  <motion.li
                    key={gr.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border border-border bg-muted/20 p-4"
                  >
                    <div className="flex flex-wrap gap-2 mb-2">
                      {gr.starRating != null && (
                        <span className="text-sm font-medium">{gr.starRating}/5</span>
                      )}
                      {gr.sentiment && (
                        <Badge variant="secondary" className="text-xs capitalize">{gr.sentiment}</Badge>
                      )}
                      {gr.topics?.slice(0, 3).map((t) => (
                        <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
                      ))}
                      {gr.reviewerDisplayName && (
                        <span className="text-xs text-muted-foreground">— {gr.reviewerDisplayName}</span>
                      )}
                    </div>
                    <p className="text-sm text-foreground mb-2">{gr.comment ?? "(No comment)"}</p>
                    {gr.reviewReply && (
                      <p className="text-sm text-muted-foreground border-l-2 border-primary/30 pl-2 mb-2">
                        Your reply: {gr.reviewReply}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={generatingReplyFor === gr.id}
                        onClick={() => generateReplyForGoogle(gr)}
                      >
                        {generatingReplyFor === gr.id ? "Generating…" : "Generate AI reply"}
                      </Button>
                      {replyFor[gr.id] && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => copyReply(gr.id, replyFor[gr.id])}>
                            {copiedId === gr.id ? "Copied" : "Copy"}
                          </Button>
                          <Button
                            size="sm"
                            disabled={postingReplyFor === gr.id}
                            onClick={() => postReply(gr.id, replyFor[gr.id])}
                          >
                            {postingReplyFor === gr.id ? "Posting…" : "Approve & post to Google"}
                          </Button>
                        </>
                      )}
                    </div>
                    {replyFor[gr.id] && (
                      <div className="mt-3">
                        <Textarea
                          className="min-h-[80px] text-sm"
                          value={replyFor[gr.id]}
                          onChange={(e) => setReplyFor((prev) => ({ ...prev, [gr.id]: e.target.value }))}
                          placeholder="Edit reply before posting…"
                        />
                      </div>
                    )}
                  </motion.li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      {/* Feedback submissions (QR flow) */}
      <Card className="admin-card border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">Feedback & generated reviews</CardTitle>
          <CardDescription className="text-muted-foreground">
            Submissions from your QR feedback flow. Generate AI replies (Settings → AI reply style).
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
    </div>
  );
}

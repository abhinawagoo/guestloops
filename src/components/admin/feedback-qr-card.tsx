"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { Venue } from "@/types/venue";
import { Download, Copy, Share2 } from "lucide-react";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== "undefined" ? window.location.origin : "");

export function FeedbackQRCard() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [venueId, setVenueId] = useState("");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/admin/venues")
      .then((r) => r.json())
      .then((data) => {
        const list = data.venues ?? [];
        setVenues(list);
        if (list.length > 0 && !venueId) setVenueId(list[0].id);
      })
      .catch(() => setVenues([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (venues.length > 0 && !venueId) setVenueId(venues[0].id);
  }, [venues, venueId]);

  const selectedVenue = venues.find((v) => v.id === venueId);
  const feedbackUrl = venueId ? `${APP_URL.replace(/\/$/, "")}/q/${venueId}/feedback` : "";
  const qrSrc = venueId ? `/api/admin/qr?venueId=${encodeURIComponent(venueId)}` : "";

  const handleDownload = async () => {
    if (!qrSrc || !selectedVenue) return;
    const name = (selectedVenue.name || "feedback").replace(/[^a-z0-9-_]/gi, "-").slice(0, 40);
    try {
      const res = await fetch(qrSrc, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load QR");
      const contentType = res.headers.get("Content-Type") ?? "";
      if (!contentType.includes("image/png")) throw new Error("Invalid response");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `guestloops-feedback-qr-${name}.png`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      const link = document.createElement("a");
      link.href = qrSrc;
      link.download = `guestloops-feedback-qr-${name}.png`;
      link.target = "_blank";
      link.rel = "noopener";
      link.click();
    }
  };

  const handleCopyLink = async () => {
    if (!feedbackUrl) return;
    try {
      await navigator.clipboard.writeText(feedbackUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const input = document.createElement("input");
      input.value = feedbackUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    if (!feedbackUrl || !selectedVenue) return;
    const title = `Feedback – ${selectedVenue.name}`;
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({
          title,
          text: `Leave your feedback for ${selectedVenue.name}`,
          url: feedbackUrl,
        });
      } catch (e) {
        if ((e as Error).name !== "AbortError") handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  if (loading) {
    return (
      <Card className="admin-card border bg-card">
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Loading…
        </CardContent>
      </Card>
    );
  }

  if (venues.length === 0) {
    return (
      <Card className="admin-card border bg-card">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold">Feedback QR</CardTitle>
          <CardDescription>Add a venue in Setup to get your feedback QR and link.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="admin-card border bg-card">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold">Feedback QR & link</CardTitle>
        <CardDescription>
          Download the QR or copy the link for guests to leave feedback. Use it on tables, receipts, or at the counter.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Venue</Label>
          <select
            value={venueId}
            onChange={(e) => setVenueId(e.target.value)}
            className="w-full max-w-xs rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          >
            {venues.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </div>
        {selectedVenue && (
          <>
            <p className="text-sm font-medium text-foreground">{selectedVenue.name}</p>
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <div className="rounded-xl border border-border bg-muted/30 p-3">
                {qrSrc ? (
                  <img
                    src={qrSrc}
                    alt={`QR code for ${selectedVenue.name} feedback`}
                    className="h-[200px] w-[200px] sm:h-[240px] sm:w-[240px]"
                    width={240}
                    height={240}
                  />
                ) : null}
              </div>
              <div className="flex flex-col gap-2">
                <Button variant="default" size="sm" className="rounded-xl gap-2" onClick={handleDownload}>
                  <Download className="h-4 w-4" />
                  Download QR
                </Button>
                <Button variant="outline" size="sm" className="rounded-xl gap-2" onClick={handleCopyLink}>
                  <Copy className="h-4 w-4" />
                  {copied ? "Copied" : "Copy link"}
                </Button>
                <Button variant="outline" size="sm" className="rounded-xl gap-2" onClick={handleShare}>
                  <Share2 className="h-4 w-4" />
                  Share
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground break-all">{feedbackUrl}</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Venue } from "@/types/venue";

const GOOGLE_REVIEW_LINK = "https://support.google.com/business/answer/2622994";
const GOOGLE_BUSINESS_LINK = "https://business.google.com/";

export function OnboardingClient({
  initialVenues,
}: {
  initialVenues: Venue[];
}) {
  const router = useRouter();
  const [venues, setVenues] = useState<Venue[]>(initialVenues);
  const [venueName, setVenueName] = useState("");
  const [venueType, setVenueType] = useState<"restaurant" | "hotel">("restaurant");
  const [creatingVenue, setCreatingVenue] = useState(false);
  const [googleReviewUrl, setGoogleReviewUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const firstVenue = venues[0];
  const hasVenues = venues.length > 0;

  const createVenue = async () => {
    if (!venueName.trim()) return;
    setError(null);
    setCreatingVenue(true);
    try {
      const res = await fetch("/api/admin/venues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: venueName.trim(), type: venueType }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Failed to add location");
        return;
      }
      if (data.venue) {
        setVenues((prev) => [...prev, data.venue]);
        setVenueName("");
      }
    } finally {
      setCreatingVenue(false);
    }
  };

  const saveGoogleUrlAndContinue = async () => {
    if (!firstVenue?.id) return;
    setError(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/settings/${firstVenue.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          googleReviewUrl: googleReviewUrl.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to save");
        return;
      }
      router.push("/admin");
    } finally {
      setSaving(false);
    }
  };

  const skipToDashboard = () => {
    router.push("/admin");
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Quick setup
        </h1>
        <p className="text-muted-foreground text-sm mt-1.5">
          Connect Google Business so guests can leave reviews from day one.
        </p>
      </div>

      {!hasVenues && (
        <Card className="border bg-card">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Add your first location</CardTitle>
            <CardDescription>
              Give this venue a name so we can attach your Google review link to it.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="venueName">Location name</Label>
              <Input
                id="venueName"
                placeholder="e.g. Main Street Restaurant"
                value={venueName}
                onChange={(e) => setVenueName(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={venueType === "restaurant" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setVenueType("restaurant")}
                >
                  Restaurant
                </Button>
                <Button
                  type="button"
                  variant={venueType === "hotel" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setVenueType("hotel")}
                >
                  Hotel
                </Button>
              </div>
            </div>
            <Button
              onClick={createVenue}
              disabled={!venueName.trim() || creatingVenue}
              className="rounded-xl"
            >
              {creatingVenue ? "Adding…" : "Add location"}
            </Button>
          </CardContent>
        </Card>
      )}

      {hasVenues && (
        <Card className="border bg-card">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Google Business Profile</CardTitle>
            <CardDescription>
              Add your Google review page link so guests can submit reviews directly from the feedback flow.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              If you haven’t already,{" "}
              <a
                href={GOOGLE_BUSINESS_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline hover:no-underline"
              >
                set up your Business Profile
              </a>
              , then{" "}
              <a
                href={GOOGLE_REVIEW_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline hover:no-underline"
              >
                get your review link
              </a>
              . Paste it below so we can send happy guests straight to your Google review page.
            </p>
            <div className="space-y-2">
              <Label htmlFor="googleReviewUrl">Google review page URL</Label>
              <Input
                id="googleReviewUrl"
                type="url"
                placeholder="https://search.google.com/local/writereview?placeid=..."
                value={googleReviewUrl}
                onChange={(e) => setGoogleReviewUrl(e.target.value)}
                className="rounded-xl font-mono text-sm"
              />
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={saveGoogleUrlAndContinue}
                disabled={saving}
                className="rounded-xl"
              >
                {saving ? "Saving…" : "Save and go to dashboard"}
              </Button>
              <Button
                variant="ghost"
                onClick={skipToDashboard}
                disabled={saving}
                className="rounded-xl"
              >
                Skip for now
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {hasVenues && (
        <p className="text-xs text-muted-foreground">
          You can change this later in Settings → Guest-facing text → Google review page URL.
        </p>
      )}
    </div>
  );
}

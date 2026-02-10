import { NextResponse } from "next/server";
import { requireAdminTenant } from "@/lib/require-admin-tenant";
import { getValidAccessTokenForTenant } from "@/lib/google-business";
import { listReviews, gbpStarToNumber, type GBPReview } from "@/lib/google-business";
import { createAdminClient } from "@/lib/supabase/admin";
import { getVenuesByTenantIdAsync } from "@/lib/tenant-resolver";
import { createClient } from "@/lib/supabase/server";
import { analyzeContent } from "@/lib/growth-intelligence";

export const dynamic = "force-dynamic";

function mapGbpReviewToRow(
  r: GBPReview,
  venueId: string,
  tenantId: string
): Record<string, unknown> {
  const starRating = gbpStarToNumber(r.starRating);
  const comment = r.comment ?? "";
  const reviewReply = r.reviewReply?.comment ?? null;
  const gbpUpdatedAt = r.updateTime ?? r.createTime ?? null;
  return {
    venue_id: venueId,
    tenant_id: tenantId,
    gbp_review_name: r.name,
    reviewer_display_name: r.reviewer?.displayName ?? null,
    star_rating: starRating || null,
    comment: comment || null,
    review_reply: reviewReply,
    gbp_updated_at: gbpUpdatedAt,
    replied_at: reviewReply ? new Date().toISOString() : null,
  };
}

export async function POST(request: Request) {
  const admin = await requireAdminTenant();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const venueId = (body.venueId as string) ?? "";

  if (!venueId) {
    return NextResponse.json({ error: "venueId required" }, { status: 400 });
  }

  const supabase = await createClient();
  const venues = await getVenuesByTenantIdAsync(admin.tenantId, supabase ?? undefined);
  if (!venues.some((v) => v.id === venueId)) {
    return NextResponse.json({ error: "Venue not found" }, { status: 404 });
  }

  const db = createAdminClient();
  if (!db) return NextResponse.json({ error: "Database error" }, { status: 500 });

  const { data: link } = await db
    .from("venue_gbp_locations")
    .select("gbp_account_id, gbp_location_id")
    .eq("venue_id", venueId)
    .single();

  if (!link) {
    return NextResponse.json({ error: "Venue not linked to Google Business Profile" }, { status: 400 });
  }

  const accessToken = await getValidAccessTokenForTenant(admin.tenantId);
  if (!accessToken) {
    return NextResponse.json({ error: "Google not connected" }, { status: 400 });
  }

  const accountId = (link as { gbp_account_id: string }).gbp_account_id;
  const locationId = (link as { gbp_location_id: string }).gbp_location_id;

  const allReviews: GBPReview[] = [];
  let pageToken: string | undefined;
  do {
    const result = await listReviews(accessToken, accountId, locationId, {
      pageSize: 50,
      pageToken,
      orderBy: "updateTime desc",
    });
    allReviews.push(...result.reviews);
    pageToken = result.nextPageToken;
  } while (pageToken);

  const now = new Date().toISOString();
  let analyzed = 0;
  for (const r of allReviews) {
    const row = mapGbpReviewToRow(r, venueId, admin.tenantId);
    const { data: existing } = await db
      .from("google_reviews")
      .select("id, comment, gbp_updated_at, ai_analyzed_at")
      .eq("venue_id", venueId)
      .eq("gbp_review_name", r.name)
      .single();

    const comment = (row.comment as string) ?? "";
    const starRating = (row.star_rating as number) ?? 0;
    let sentiment: string | null = null;
    let topics: string[] = [];
    let trendTags: string[] = [];
    let sentimentScore: number | null = null;
    let emotionLabel: string | null = null;
    let localSeoKeywords: string[] = [];
    const shouldAnalyze = !existing?.ai_analyzed_at || (existing?.gbp_updated_at !== row.gbp_updated_at);
    if (comment && shouldAnalyze) {
      const analysis = await analyzeContent(comment, {
        starRating,
        source: "review",
      });
      sentiment = analysis.sentiment;
      topics = analysis.topics;
      trendTags = analysis.trend_tags;
      sentimentScore = analysis.sentiment_score;
      emotionLabel = analysis.emotion_label;
      localSeoKeywords = analysis.local_seo_keywords;
      analyzed++;
    }

    await db.from("google_reviews").upsert(
      {
        ...row,
        sentiment,
        topics: topics.length ? topics : [],
        trend_tags: trendTags.length ? trendTags : [],
        sentiment_score: sentimentScore,
        emotion_label: emotionLabel,
        local_seo_keywords: localSeoKeywords.length ? localSeoKeywords : [],
        ai_analyzed_at: sentiment ? now : (existing as { ai_analyzed_at: string } | null)?.ai_analyzed_at ?? null,
        updated_at: now,
      },
      { onConflict: "venue_id,gbp_review_name" }
    );
  }

  return NextResponse.json({
    ok: true,
    synced: allReviews.length,
    analyzed,
  });
}

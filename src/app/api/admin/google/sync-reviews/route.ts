import { NextResponse } from "next/server";
import OpenAI from "openai";
import { requireAdminTenant } from "@/lib/require-admin-tenant";
import { getValidAccessTokenForTenant } from "@/lib/google-business";
import { listReviews, gbpStarToNumber, type GBPReview } from "@/lib/google-business";
import { createAdminClient } from "@/lib/supabase/admin";
import { getVenuesByTenantIdAsync } from "@/lib/tenant-resolver";
import { createClient } from "@/lib/supabase/server";
import {
  REVIEW_ANALYSIS_SYSTEM,
  buildReviewAnalysisUserPrompt,
} from "@/lib/prompts/review-analysis.prompt";

export const dynamic = "force-dynamic";

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

async function analyzeReview(text: string, starRating?: number): Promise<{
  sentiment: "positive" | "neutral" | "negative";
  topics: string[];
  trendTags: string[];
}> {
  const fallback = { sentiment: "neutral" as const, topics: [] as string[], trendTags: [] as string[] };
  if (!openai || !text.trim()) return fallback;
  try {
    const prompt = buildReviewAnalysisUserPrompt(text, starRating);
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: REVIEW_ANALYSIS_SYSTEM },
        { role: "user", content: prompt },
      ],
      max_tokens: 200,
      temperature: 0.2,
    });
    const raw = completion.choices[0]?.message?.content?.trim();
    if (!raw) return fallback;
    const parsed = JSON.parse(raw.replace(/^```json\s*|\s*```$/g, "")) as {
      sentiment?: string;
      topics?: string[];
      trendTags?: string[];
    };
    const sentiment =
      parsed.sentiment === "positive" || parsed.sentiment === "negative"
        ? parsed.sentiment
        : "neutral";
    return {
      sentiment,
      topics: Array.isArray(parsed.topics) ? parsed.topics : [],
      trendTags: Array.isArray(parsed.trendTags) ? parsed.trendTags : [],
    };
  } catch {
    return fallback;
  }
}

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
    const shouldAnalyze = !existing?.ai_analyzed_at || (existing?.gbp_updated_at !== row.gbp_updated_at);
    if (comment && shouldAnalyze) {
      const analysis = await analyzeReview(comment, starRating);
      sentiment = analysis.sentiment;
      topics = analysis.topics;
      trendTags = analysis.trendTags;
      analyzed++;
    }

    await db.from("google_reviews").upsert(
      {
        ...row,
        sentiment,
        topics: topics.length ? topics : [],
        trend_tags: trendTags,
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

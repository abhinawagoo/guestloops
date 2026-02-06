import { NextResponse } from "next/server";
import { requireAdminTenant } from "@/lib/require-admin-tenant";
import { createAdminClient } from "@/lib/supabase/admin";
import { getVenuesByTenantIdAsync } from "@/lib/tenant-resolver";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const admin = await requireAdminTenant();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const venueId = searchParams.get("venueId");
  if (!venueId) {
    return NextResponse.json({ error: "venueId required" }, { status: 400 });
  }

  const supabase = await createClient();
  const venues = await getVenuesByTenantIdAsync(admin.tenantId, supabase ?? undefined);
  if (!venues.some((v) => v.id === venueId)) {
    return NextResponse.json({ error: "Venue not found" }, { status: 404 });
  }

  const db = createAdminClient();
  if (!db) return NextResponse.json({ googleReviews: [] });

  const { data: rows, error } = await db
    .from("google_reviews")
    .select("*")
    .eq("venue_id", venueId)
    .eq("tenant_id", admin.tenantId)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("[admin/google/reviews]", error);
    return NextResponse.json({ googleReviews: [] });
  }

  const googleReviews = (rows ?? []).map((r: Record<string, unknown>) => ({
    id: r.id,
    venueId: r.venue_id,
    gbpReviewName: r.gbp_review_name,
    reviewerDisplayName: r.reviewer_display_name,
    starRating: r.star_rating,
    comment: r.comment,
    reviewReply: r.review_reply,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    gbpUpdatedAt: r.gbp_updated_at,
    repliedAt: r.replied_at,
    sentiment: r.sentiment,
    topics: (r.topics as string[]) ?? [],
    trendTags: (r.trend_tags as string[]) ?? [],
    aiAnalyzedAt: r.ai_analyzed_at,
  }));

  return NextResponse.json({ googleReviews });
}

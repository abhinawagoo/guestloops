import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getTenantFromHeaders } from "@/lib/tenant";
import { getVenueForTenant } from "@/data/tenants";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const venueId = searchParams.get("venueId");
  if (!venueId) {
    return NextResponse.json({ error: "venueId required" }, { status: 400 });
  }

  const headersList = await headers();
  const ctx = getTenantFromHeaders(headersList);
  if (ctx.hostType !== "tenant" || !ctx.tenantId) {
    return NextResponse.json({ error: "Tenant required" }, { status: 403 });
  }

  const venue = getVenueForTenant(ctx.tenantId, venueId);
  if (!venue) {
    return NextResponse.json({ error: "Venue not found" }, { status: 404 });
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ submissions: [] });
  }

  const { data: rows, error } = await supabase
    .from("feedback_submissions")
    .select("id, venue_id, scores, text_answers, generated_review_text, review_outcome, created_at")
    .eq("venue_id", venueId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("[admin/reviews]", error);
    return NextResponse.json(
      { error: "Failed to load reviews" },
      { status: 500 }
    );
  }

  const submissions = (rows ?? []).map((r) => ({
    id: r.id,
    venueId: r.venue_id,
    scores: (r.scores as Record<string, number>) ?? {},
    textAnswers: (r.text_answers as Record<string, string>) ?? {},
    generatedReviewText: r.generated_review_text ?? undefined,
    reviewOutcome: r.review_outcome ?? undefined,
    createdAt: r.created_at,
  }));

  return NextResponse.json({ submissions });
}

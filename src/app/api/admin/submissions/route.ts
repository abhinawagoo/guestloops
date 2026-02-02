import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getTenantFromHeaders } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get("limit")) || 20, 50);

  const headersList = await headers();
  const ctx = getTenantFromHeaders(headersList);
  if (ctx.hostType !== "tenant" || !ctx.tenantId) {
    return NextResponse.json({ error: "Tenant required" }, { status: 403 });
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ submissions: [] });
  }

  const { data: rows, error } = await supabase
    .from("feedback_submissions")
    .select("id, venue_id, scores, text_answers, yes_no_answers, optional_text, generated_review_text, review_outcome, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[admin/submissions]", error);
    return NextResponse.json(
      { error: "Failed to load submissions" },
      { status: 500 }
    );
  }

  const venueIds = [...new Set((rows ?? []).map((r: { venue_id: string }) => r.venue_id))];
  let venueNames: Record<string, string> = {};
  if (venueIds.length > 0) {
    const { data: venues } = await supabase
      .from("venues")
      .select("id, name")
      .in("id", venueIds);
    venueNames = (venues ?? []).reduce(
      (acc, v: { id: string; name: string }) => {
        acc[v.id] = v.name;
        return acc;
      },
      {} as Record<string, string>
    );
  }

  const submissions = (rows ?? []).map((r: Record<string, unknown>) => ({
    id: r.id,
    venueId: r.venue_id,
    venueName: venueNames[r.venue_id as string] ?? (r.venue_id as string),
    scores: (r.scores as Record<string, number>) ?? {},
    textAnswers: (r.text_answers as Record<string, string>) ?? {},
    yesNoAnswers: (r.yes_no_answers as Record<string, boolean>) ?? {},
    optionalText: r.optional_text ?? undefined,
    generatedReviewText: r.generated_review_text ?? undefined,
    reviewOutcome: r.review_outcome ?? undefined,
    createdAt: r.created_at,
  }));

  return NextResponse.json({ submissions });
}

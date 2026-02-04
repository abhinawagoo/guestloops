import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getTenantFromHeaders } from "@/lib/tenant";

export const dynamic = "force-dynamic";

const ASPECT_DISPLAY_NAMES: Record<string, string> = {
  overall: "Overall",
  cleanliness: "Cleanliness",
  service: "Service",
  foodQuality: "Food Quality",
  roomQuality: "Room Quality",
  value: "Value",
};

function displayName(key: string): string {
  return (
    ASPECT_DISPLAY_NAMES[key] ??
    key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()).trim()
  );
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const days = Math.min(Math.max(Number(searchParams.get("days")) || 30, 1), 365);

  const headersList = await headers();
  const ctx = getTenantFromHeaders(headersList);
  if (ctx.hostType !== "tenant" || !ctx.tenantId) {
    return NextResponse.json({ error: "Tenant required" }, { status: 403 });
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({
      aspectScores: [],
      totalSubmissions: 0,
      googleRedirectCount: 0,
      completionToGooglePercent: 0,
    });
  }

  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceIso = since.toISOString();

  const { data: rows, error } = await supabase
    .from("feedback_submissions")
    .select("scores, review_outcome")
    .gte("created_at", sinceIso);

  if (error) {
    console.error("[admin/dashboard-stats]", error);
    return NextResponse.json(
      { error: "Failed to load dashboard stats" },
      { status: 500 }
    );
  }

  const submissions = rows ?? [];
  const totalSubmissions = submissions.length;
  const googleRedirectCount = submissions.filter(
    (r: { review_outcome?: string }) => r.review_outcome === "google_redirect"
  ).length;
  const completionToGooglePercent =
    totalSubmissions > 0
      ? Math.round((googleRedirectCount / totalSubmissions) * 100)
      : 0;

  // Aggregate scores: key -> { sum, count }
  const agg: Record<string, { sum: number; count: number }> = {};
  for (const row of submissions) {
    const scores = (row.scores as Record<string, number>) ?? {};
    for (const [key, value] of Object.entries(scores)) {
      const num = typeof value === "number" && value >= 1 && value <= 5 ? value : null;
      if (num == null) continue;
      if (!agg[key]) agg[key] = { sum: 0, count: 0 };
      agg[key].sum += num;
      agg[key].count += 1;
    }
  }

  const aspectScores = Object.entries(agg)
    .filter(([, v]) => v.count > 0)
    .map(([key, v]) => ({
      aspect: displayName(key),
      key,
      score: Math.round((v.sum / v.count / 5) * 100),
      count: v.count,
    }))
    .sort((a, b) => {
      if (a.aspect === "Overall") return -1;
      if (b.aspect === "Overall") return 1;
      return a.aspect.localeCompare(b.aspect);
    });

  return NextResponse.json({
    aspectScores,
    totalSubmissions,
    googleRedirectCount,
    completionToGooglePercent,
    days,
  });
}

import { NextResponse } from "next/server";
import { requireAdminTenant } from "@/lib/require-admin-tenant";
import { computeLocalGrowthScore } from "@/lib/growth-intelligence";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/growth-intelligence?days=30
 * Returns Local Growth Score and AI insights for the current tenant (business).
 * Recomputes on each request for freshness; all data isolated by tenant_id.
 */
export async function GET(request: Request) {
  const admin = await requireAdminTenant();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const days = Math.min(Math.max(Number(searchParams.get("days")) || 30, 7), 365);

  try {
    const result = await computeLocalGrowthScore(admin.tenantId, days);
    return NextResponse.json({
      localGrowthScore: result.overall_score,
      breakdown: {
        review_velocity_score: result.review_velocity_score,
        avg_rating_score: result.avg_rating_score,
        reply_rate_score: result.reply_rate_score,
        sentiment_strength_score: result.sentiment_strength_score,
        keyword_coverage_score: result.keyword_coverage_score,
        trend_improvement_score: result.trend_improvement_score,
      },
      strengths: result.strengths,
      weak_areas: result.weak_areas,
      ai_recommendations: result.ai_recommendations,
      seo_keyword_gaps: result.seo_keyword_gaps,
      days,
    });
  } catch (e) {
    console.error("[admin/growth-intelligence]", e);
    return NextResponse.json(
      { error: "Failed to compute growth intelligence" },
      { status: 500 }
    );
  }
}

/**
 * AI Growth Intelligence: analyze review/feedback content and compute business-level Local Growth Score.
 * All operations scoped by tenant_id (business) for multi-tenant isolation.
 */

import OpenAI from "openai";
import {
  GROWTH_ANALYSIS_SYSTEM,
  buildGrowthAnalysisUserPrompt,
} from "@/lib/prompts/growth-analysis.prompt";
import { createAdminClient } from "@/lib/supabase/admin";

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export interface GrowthAnalysisResult {
  sentiment: "positive" | "neutral" | "negative";
  sentiment_score: number;
  emotion_label: string;
  topics: string[];
  trend_tags: string[];
  local_seo_keywords: string[];
}

const DEFAULT_ANALYSIS: GrowthAnalysisResult = {
  sentiment: "neutral",
  sentiment_score: 50,
  emotion_label: "neutral",
  topics: [],
  trend_tags: [],
  local_seo_keywords: [],
};

export async function analyzeContent(
  content: string,
  context?: { starRating?: number; venueType?: string; source?: "review" | "feedback" }
): Promise<GrowthAnalysisResult> {
  if (!openai || !content?.trim()) return DEFAULT_ANALYSIS;
  try {
    const prompt = buildGrowthAnalysisUserPrompt(content, context);
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: GROWTH_ANALYSIS_SYSTEM },
        { role: "user", content: prompt },
      ],
      max_tokens: 300,
      temperature: 0.2,
    });
    const raw = completion.choices[0]?.message?.content?.trim();
    if (!raw) return DEFAULT_ANALYSIS;
    const parsed = JSON.parse(raw.replace(/^```json\s*|\s*```$/g, "")) as {
      sentiment?: string;
      sentiment_score?: number;
      emotion_label?: string;
      topics?: string[];
      trend_tags?: string[];
      local_seo_keywords?: string[];
    };
    const sentiment =
      parsed.sentiment === "positive" || parsed.sentiment === "negative"
        ? parsed.sentiment
        : "neutral";
    const sentiment_score =
      typeof parsed.sentiment_score === "number" && parsed.sentiment_score >= 0 && parsed.sentiment_score <= 100
        ? Math.round(parsed.sentiment_score)
        : sentiment === "positive"
          ? 75
          : sentiment === "negative"
            ? 25
            : 50;
    return {
      sentiment,
      sentiment_score,
      emotion_label: typeof parsed.emotion_label === "string" ? parsed.emotion_label.slice(0, 80) : "neutral",
      topics: Array.isArray(parsed.topics) ? parsed.topics.slice(0, 10) : [],
      trend_tags: Array.isArray(parsed.trend_tags) ? parsed.trend_tags.slice(0, 5) : [],
      local_seo_keywords: Array.isArray(parsed.local_seo_keywords) ? parsed.local_seo_keywords.slice(0, 10) : [],
    };
  } catch {
    return DEFAULT_ANALYSIS;
  }
}

/** Build a single text block from feedback submission for AI analysis. */
export function feedbackToAnalysisText(row: {
  scores?: Record<string, number>;
  optional_text?: string | null;
  text_answers?: Record<string, string> | null;
}): string {
  const parts: string[] = [];
  const scores = row.scores ?? {};
  const overall = scores.overall;
  if (typeof overall === "number") parts.push(`Overall rating: ${overall}/5.`);
  if (scores.cleanliness != null) parts.push(`Cleanliness: ${scores.cleanliness}/5.`);
  if (scores.service != null) parts.push(`Service: ${scores.service}/5.`);
  if (scores.food_quality != null) parts.push(`Food quality: ${scores.food_quality}/5.`);
  if (scores.room_quality != null) parts.push(`Room quality: ${scores.room_quality}/5.`);
  if (scores.value != null) parts.push(`Value: ${scores.value}/5.`);
  if (row.optional_text?.trim()) parts.push(`Note: ${row.optional_text.trim()}`);
  const textAnswers = row.text_answers ?? {};
  for (const [k, v] of Object.entries(textAnswers)) {
    if (!v || typeof v !== "string") continue;
    let display = v;
    try {
      const parsed = JSON.parse(v) as unknown;
      if (Array.isArray(parsed)) display = (parsed as string[]).join(", ");
    } catch {
      // keep as-is
    }
    parts.push(`${k}: ${display}`);
  }
  return parts.join(" ") || "No text feedback.";
}

/**
 * Run AI analysis for a feedback submission and persist to DB.
 * Call from feedback submit (fire-and-forget) or cron. Uses admin client for RLS bypass.
 */
export async function runFeedbackAnalysis(submissionId: string): Promise<void> {
  const db = createAdminClient();
  if (!db) return;
  const { data: row, error: fetchError } = await db
    .from("feedback_submissions")
    .select("id, scores, optional_text, text_answers, ai_analyzed_at")
    .eq("id", submissionId)
    .single();
  if (fetchError || !row) return;
  const content = feedbackToAnalysisText(row);
  const context = { source: "feedback" as const };
  const analysis = await analyzeContent(content, context);
  const now = new Date().toISOString();
  await db
    .from("feedback_submissions")
    .update({
      sentiment_score: analysis.sentiment_score,
      emotion_label: analysis.emotion_label,
      topics: analysis.topics,
      local_seo_keywords: analysis.local_seo_keywords,
      ai_analyzed_at: now,
    })
    .eq("id", submissionId);
}

// --- Local Growth Score (per tenant_id) ---

export interface LocalGrowthScoreInput {
  tenant_id: string;
  /** Period length in days for velocity/trend (e.g. 30) */
  days?: number;
}

export interface LocalGrowthScoreResult {
  overall_score: number;
  review_velocity_score: number;
  avg_rating_score: number;
  reply_rate_score: number;
  sentiment_strength_score: number;
  keyword_coverage_score: number;
  trend_improvement_score: number;
  strengths: string[];
  weak_areas: string[];
  ai_recommendations: string[];
  seo_keyword_gaps: string[];
}

const DEFAULT_GROWTH: LocalGrowthScoreResult = {
  overall_score: 0,
  review_velocity_score: 0,
  avg_rating_score: 0,
  reply_rate_score: 0,
  sentiment_strength_score: 0,
  keyword_coverage_score: 0,
  trend_improvement_score: 50,
  strengths: [],
  weak_areas: [],
  ai_recommendations: ["Collect more reviews and feedback to unlock your Local Growth Score."],
  seo_keyword_gaps: [],
};

/** Score 0–100 from a value and optional min/max for normalization. */
function toScore(value: number, max: number, min = 0): number {
  if (max <= min) return 50;
  const normalized = (value - min) / (max - min);
  return Math.round(Math.min(100, Math.max(0, normalized * 100)));
}

/**
 * Compute Local Growth Score for a tenant from reviews + feedback. Isolated by tenant_id.
 * Writes to local_growth_scores (upsert by tenant_id).
 */
export async function computeLocalGrowthScore(
  tenantId: string,
  days = 30
): Promise<LocalGrowthScoreResult> {
  const db = createAdminClient();
  if (!db) return DEFAULT_GROWTH;

  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceIso = since.toISOString();
  const prevSince = new Date(since);
  prevSince.setDate(prevSince.getDate() - days);
  const prevSinceIso = prevSince.toISOString();

  // Reviews for this tenant in current and previous period
  const { data: reviews } = await db
    .from("google_reviews")
    .select("id, star_rating, review_reply, sentiment_score, sentiment, local_seo_keywords, created_at")
    .eq("tenant_id", tenantId);

  const { data: feedbackRows } = await db
    .from("feedback_submissions")
    .select("id, scores, sentiment_score, local_seo_keywords, created_at")
    .eq("tenant_id", tenantId);

  const reviewsList = reviews ?? [];
  const feedbackList = feedbackRows ?? [];

  const reviewsCurrent = reviewsList.filter((r) => r.created_at >= sinceIso);
  const feedbackCurrent = feedbackList.filter((f) => f.created_at >= sinceIso);
  const reviewsPrev = reviewsList.filter((r) => r.created_at >= prevSinceIso && r.created_at < sinceIso);
  const feedbackPrev = feedbackList.filter((f) => f.created_at >= prevSinceIso && f.created_at < sinceIso);

  const totalCurrent = reviewsCurrent.length + feedbackCurrent.length;
  const totalPrev = reviewsPrev.length + feedbackPrev.length;

  // Review velocity: reviews+feedback per week, normalized to 0–100 (e.g. 5/week = 100)
  const weeks = days / 7;
  const rateCurrent = weeks > 0 ? totalCurrent / weeks : 0;
  const review_velocity_score = toScore(rateCurrent, 5, 0);

  // Average rating: from star_rating (reviews) and scores.overall (feedback)
  let ratingSum = 0;
  let ratingCount = 0;
  for (const r of reviewsList) {
    if (r.star_rating != null) {
      ratingSum += r.star_rating;
      ratingCount++;
    }
  }
  for (const f of feedbackList) {
    const o = (f.scores as Record<string, number>)?.overall;
    if (typeof o === "number" && o >= 1 && o <= 5) {
      ratingSum += o;
      ratingCount++;
    }
  }
  const avgRating = ratingCount > 0 ? ratingSum / ratingCount : 0;
  const avg_rating_score = toScore(avgRating, 5, 1);

  // Reply rate: % of Google reviews that have a reply
  const withReply = reviewsList.filter((r) => r.review_reply && String(r.review_reply).trim().length > 0).length;
  const reply_rate_score = reviewsList.length > 0 ? Math.round((withReply / reviewsList.length) * 100) : 0;

  // Sentiment strength: average sentiment_score (0–100) from analyzed items
  const sentimentScores: number[] = [];
  for (const r of reviewsList) {
    if (r.sentiment_score != null) sentimentScores.push(r.sentiment_score);
  }
  for (const f of feedbackList) {
    if (f.sentiment_score != null) sentimentScores.push(f.sentiment_score);
  }
  const avgSentiment = sentimentScores.length > 0
    ? sentimentScores.reduce((a, b) => a + b, 0) / sentimentScores.length
    : 50;
  const sentiment_strength_score = Math.round(avgSentiment);

  // Keyword coverage: diversity of local_seo_keywords (unique count; cap at 20 = 100)
  const allKeywords = new Set<string>();
  for (const r of reviewsList) {
    const kw = (r.local_seo_keywords as string[]) ?? [];
    kw.forEach((k) => allKeywords.add(String(k).toLowerCase().trim()));
  }
  for (const f of feedbackList) {
    const kw = (f.local_seo_keywords as string[]) ?? [];
    kw.forEach((k) => allKeywords.add(String(k).toLowerCase().trim()));
  }
  const keyword_coverage_score = toScore(allKeywords.size, 20, 0);

  // Trend improvement: compare current vs previous period (rating + volume)
  const avgRatingCurrent =
    [...reviewsCurrent, ...feedbackCurrent].reduce((sum, r) => {
      const s = (r as { star_rating?: number; scores?: Record<string, number> }).star_rating ??
        (r as { scores?: Record<string, number> }).scores?.overall;
      return sum + (typeof s === "number" ? s : 0);
    }, 0) /
    Math.max(1, reviewsCurrent.length + feedbackCurrent.length);
  const avgRatingPrev =
    [...reviewsPrev, ...feedbackPrev].reduce((sum, r) => {
      const s = (r as { star_rating?: number; scores?: Record<string, number> }).star_rating ??
        (r as { scores?: Record<string, number> }).scores?.overall;
      return sum + (typeof s === "number" ? s : 0);
    }, 0) /
    Math.max(1, reviewsPrev.length + feedbackPrev.length);
  const ratingTrend = totalCurrent + totalPrev > 0 ? avgRatingCurrent - avgRatingPrev : 0;
  const volumeTrend = totalPrev > 0 ? (totalCurrent - totalPrev) / totalPrev : 0;
  const trend_improvement_score = Math.round(50 + ratingTrend * 20 + Math.min(0.5, volumeTrend) * 100);
  const trendClamped = Math.min(100, Math.max(0, trend_improvement_score));

  // Weighted overall
  const overall_score = Math.round(
    review_velocity_score * 0.15 +
      avg_rating_score * 0.25 +
      reply_rate_score * 0.2 +
      sentiment_strength_score * 0.15 +
      keyword_coverage_score * 0.1 +
      trendClamped * 0.15
  );
  const overallClamped = Math.min(100, Math.max(0, overall_score));

  // Rule-based strengths, weak areas, recommendations, SEO gaps
  const strengths: string[] = [];
  const weak_areas: string[] = [];
  const ai_recommendations: string[] = [];
  const seo_keyword_gaps: string[] = [];

  if (avg_rating_score >= 70) strengths.push("Strong average rating from guests");
  if (reply_rate_score >= 70) strengths.push("Good reply rate on Google reviews");
  if (sentiment_strength_score >= 60) strengths.push("Positive sentiment in feedback");
  if (keyword_coverage_score >= 50) strengths.push("Growing variety of local keywords in reviews");
  if (trendClamped >= 55) strengths.push("Positive trend vs previous period");
  if (review_velocity_score >= 50) strengths.push("Steady flow of new reviews and feedback");

  if (reply_rate_score < 50 && reviewsList.length > 0) {
    weak_areas.push("Low reply rate on Google reviews");
    ai_recommendations.push("Reply to every Google review (especially negative ones) within 24–48 hours");
  }
  if (avg_rating_score < 50 && (reviewsList.length > 0 || feedbackList.length > 0)) {
    weak_areas.push("Average rating could be higher");
    ai_recommendations.push("Focus on the lowest-scoring aspects (e.g. service, cleanliness) in team briefings");
  }
  if (review_velocity_score < 30) {
    weak_areas.push("Few recent reviews or feedback");
    ai_recommendations.push("Promote your feedback QR and Google review link at tables, check-out, and receipts");
  }
  if (keyword_coverage_score < 30 && (reviewsList.length > 0 || feedbackList.length > 0)) {
    seo_keyword_gaps.push("Ask guests what they searched for (e.g. 'best brunch', 'quiet hotel') to surface more local keywords");
  }
  if (sentiment_strength_score < 45 && (reviewsList.length > 0 || feedbackList.length > 0)) {
    weak_areas.push("Sentiment could be more positive");
    ai_recommendations.push("Address recurring complaints and highlight quick wins in service or cleanliness");
  }

  const defaultRecommendation = "Collect more feedback and connect Google Business Profile to sync reviews for a fuller picture.";
  if (ai_recommendations.length === 0) ai_recommendations.push(defaultRecommendation);
  if (strengths.length === 0 && (reviewsList.length > 0 || feedbackList.length > 0)) {
    strengths.push("You have review and feedback data — keep collecting to improve your score");
  }

  const result: LocalGrowthScoreResult = {
    overall_score: overallClamped,
    review_velocity_score,
    avg_rating_score,
    reply_rate_score,
    sentiment_strength_score,
    keyword_coverage_score,
    trend_improvement_score: trendClamped,
    strengths: strengths.slice(0, 6),
    weak_areas: weak_areas.slice(0, 5),
    ai_recommendations: ai_recommendations.slice(0, 5),
    seo_keyword_gaps: seo_keyword_gaps.length ? seo_keyword_gaps : ["Connect Google Business Profile and collect more feedback to discover keyword gaps."],
  };

  await db.from("local_growth_scores").upsert(
    {
      tenant_id: tenantId,
      overall_score: result.overall_score,
      review_velocity_score: result.review_velocity_score,
      avg_rating_score: result.avg_rating_score,
      reply_rate_score: result.reply_rate_score,
      sentiment_strength_score: result.sentiment_strength_score,
      keyword_coverage_score: result.keyword_coverage_score,
      trend_improvement_score: result.trend_improvement_score,
      strengths: result.strengths,
      weak_areas: result.weak_areas,
      ai_recommendations: result.ai_recommendations,
      seo_keyword_gaps: result.seo_keyword_gaps,
      computed_at: new Date().toISOString(),
    },
    { onConflict: "tenant_id" }
  );

  return result;
}

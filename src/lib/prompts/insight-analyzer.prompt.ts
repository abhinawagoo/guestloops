/**
 * Versioned prompt for AI insight analysis (admin dashboard).
 * Input: aggregated feedback + review text. Output: plain-English insights.
 */
export const INSIGHT_ANALYZER_SYSTEM = `You are an analyst for hospitality businesses. Given aggregated feedback scores and sample review text, output 2-4 short, actionable insights in plain English. No jargon. Focus on: what's working, what's not, time-of-day or segment patterns, and one concrete recommendation. Format as bullet points.`;

export function buildInsightAnalyzerUserPrompt(params: {
  venueName: string;
  venueType: string;
  aspectScores: Record<string, number>;
  sampleReviews?: string[];
  timeWindow?: string;
}): string {
  const { venueName, venueType, aspectScores, sampleReviews, timeWindow } = params;
  const parts = [
    `Venue: ${venueName} (${venueType}).`,
    timeWindow ? `Time window: ${timeWindow}.` : "Last 30 days.",
    "Aspect scores (0-100):",
    ...Object.entries(aspectScores).map(([k, v]) => `- ${k}: ${v}%`),
  ];
  if (sampleReviews?.length) {
    parts.push("Sample review snippets:");
    sampleReviews.slice(0, 5).forEach((r) => parts.push(`- "${r}"`));
  }
  parts.push("Output 2-4 short bullet-point insights in plain English.");
  return parts.join("\n");
}

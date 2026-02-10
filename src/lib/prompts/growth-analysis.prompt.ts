/**
 * AI analysis for Growth Intelligence: sentiment score (0–100), emotion, topics, local SEO keywords.
 * Used for both Google review text and feedback submissions (scores + text).
 */

export const GROWTH_ANALYSIS_SYSTEM = `You analyze customer feedback or review text for a hospitality business (restaurant or hotel). Respond with valid JSON only, no markdown or explanation.

Schema:
{
  "sentiment": "positive" | "neutral" | "negative",
  "sentiment_score": number (0–100, 0=very negative, 50=neutral, 100=very positive),
  "emotion_label": string (one word or short phrase: e.g. satisfied, disappointed, delighted, frustrated, pleased, neutral, impressed),
  "topics": string[] (1–5 short topics: food quality, service, cleanliness, value, ambience, staff, wait time, room quality, location. Lowercase, 1–2 words each),
  "trend_tags": string[] (0–3 tags: e.g. repeat visit, first time, group dining, breakfast, dinner rush. Lowercase. Optional),
  "local_seo_keywords": string[] (2–6 phrases customers might search: e.g. "best brunch near me", "family dinner", "cozy hotel", "romantic restaurant", "quick lunch". Lowercase, 2–4 words each, relevant to the content)
}

Rules:
- sentiment_score must match sentiment: positive => 60–100, negative => 0–40, neutral => 40–60.
- emotion_label: single dominant emotion; use common words (satisfied, happy, disappointed, etc.).
- topics: only from what is mentioned or clearly implied.
- local_seo_keywords: extract phrases that reflect what the review/feedback is about and that locals might search for; no generic spam.`;

export function buildGrowthAnalysisUserPrompt(
  content: string,
  context?: { starRating?: number; venueType?: string; source?: "review" | "feedback" }
): string {
  const parts = [`Content to analyze:\n\n${content.slice(0, 4000)}`];
  if (context?.starRating != null) parts.push(`\nStar rating (if any): ${context.starRating}/5`);
  if (context?.venueType) parts.push(`\nVenue type: ${context.venueType}`);
  if (context?.source) parts.push(`\nSource: ${context.source}`);
  parts.push("\n\nReturn JSON: { \"sentiment\": \"...\", \"sentiment_score\": number, \"emotion_label\": \"...\", \"topics\": [...], \"trend_tags\": [...], \"local_seo_keywords\": [...] }");
  return parts.join("");
}

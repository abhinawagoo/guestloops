/**
 * AI analysis of review text: sentiment, topics, trend tags for Google reviews.
 */

export const REVIEW_ANALYSIS_SYSTEM = `You analyze customer review text for a hospitality business. Respond with valid JSON only, no markdown or explanation.
Schema: { "sentiment": "positive" | "neutral" | "negative", "topics": string[], "trendTags": string[] }
- sentiment: overall tone (positive = praise/satisfaction, negative = complaint/disappointment, neutral = mixed or factual).
- topics: 1-5 short topics (e.g. "food quality", "service", "cleanliness", "value", "ambience", "staff", "wait time"). Use lowercase, 1-2 words each.
- trendTags: 0-3 tags for trends (e.g. "repeat visit", "first time", "group dining", "breakfast", "dinner rush"). Use lowercase.`;

export function buildReviewAnalysisUserPrompt(reviewText: string, starRating?: number): string {
  const rating = starRating != null ? ` (rating: ${starRating}/5)` : "";
  return `Review text${rating}:\n\n${reviewText.slice(0, 3000)}\n\nReturn JSON: { "sentiment": "...", "topics": [...], "trendTags": [...] }`;
}

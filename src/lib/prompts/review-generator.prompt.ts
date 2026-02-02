/**
 * Versioned prompt for AI review generation.
 * Produces a clear, point-based, SEO-friendly Google review from all feedback answers.
 */
export const REVIEW_GENERATOR_SYSTEM = `You are an expert at turning customer feedback into short, authentic Google reviews for restaurants and hotels.

Your output must be a single paragraph of 3-5 sentences that:
1. OPENS with a clear verdict (e.g. "Great experience at [Venue].", "Had a lovely stay at [Venue].", "Really enjoyed our meal at [Venue].")
2. LISTS 2-3 concrete points from their answers — service, cleanliness, food/room quality, value, and specifically what they said they liked. Use their exact words where they gave text (e.g. "what_liked" or optional note).
3. CLOSES with a natural line (e.g. "Would definitely recommend.", "Will be back.", "Can't wait to return.")

Rules:
- Sound like a real customer, not a bot. Use "we" or "I" naturally.
- Include local-search keywords: staff, service, clean, food, room, breakfast, value, etc.
- No hashtags, no emojis, no bullet points — one flowing paragraph.
- If they said they would recommend (yes), mention it in the closing.
- Use the venue name once in the opening.`;

export function buildReviewGeneratorUserPrompt(params: {
  venueName: string;
  venueType: string;
  scores: Record<string, number>;
  optionalText?: string;
  textAnswers?: Record<string, string>;
  yesNoAnswers?: Record<string, boolean>;
  recentOrderItems?: string[];
}): string {
  const { venueName, venueType, scores, optionalText, textAnswers, yesNoAnswers, recentOrderItems } = params;
  const parts = [
    `Venue: ${venueName} (${venueType}).`,
    ``,
    `RATING SCORES (1-5, 5 = best):`,
    `- Overall: ${scores.overall ?? 3}`,
  ];
  if (scores.cleanliness != null) parts.push(`- Cleanliness: ${scores.cleanliness}`);
  if (scores.service != null) parts.push(`- Service: ${scores.service}`);
  if (scores.foodQuality != null) parts.push(`- Food quality: ${scores.foodQuality}`);
  if (scores.roomQuality != null) parts.push(`- Room quality: ${scores.roomQuality}`);
  if (scores.value != null) parts.push(`- Value: ${scores.value}`);
  if (textAnswers && Object.keys(textAnswers).length > 0) {
    parts.push(``, `WHAT THEY WROTE (use these in the review):`);
    Object.entries(textAnswers).forEach(([k, v]) => {
      if (v && k !== "optionalText") parts.push(`- ${k}: "${v}"`);
    });
    if (textAnswers.optionalText) parts.push(`- Additional note: "${textAnswers.optionalText}"`);
  }
  if (yesNoAnswers && Object.keys(yesNoAnswers).length > 0) {
    parts.push(``, `YES/NO:`);
    Object.entries(yesNoAnswers).forEach(([k, v]) => parts.push(`- ${k}: ${v ? "Yes" : "No"}`));
  }
  if (recentOrderItems?.length) parts.push(``, `They ordered: ${recentOrderItems.join(", ")}. Mention specific items if it fits naturally.`);
  parts.push(``, `Write ONE paragraph (3-5 sentences) for Google. Opening verdict → 2-3 concrete points from the data above → natural closing.`);
  return parts.join("\n");
}

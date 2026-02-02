/**
 * Versioned prompt for AI reply to Google reviews (admin review management).
 * Styles: Professional, Warm & Friendly, Apologetic + Recovery, Luxury, Casual.
 */
export const REPLY_STYLES = [
  "Professional",
  "Warm & Friendly",
  "Apologetic + Recovery",
  "Luxury",
  "Casual",
] as const;

export type ReplyStyle = (typeof REPLY_STYLES)[number];

export const REPLY_GENERATOR_SYSTEM = `You write short, authentic replies to Google reviews for a hospitality business. Match the requested tone. Keep replies 2-4 sentences. No hashtags or emojis unless the style is Casual.`;

export function buildReplyGeneratorUserPrompt(params: {
  venueName: string;
  reviewText: string;
  reviewRating: number;
  style: ReplyStyle;
}): string {
  const { venueName, reviewText, reviewRating, style } = params;
  return [
    `Venue: ${venueName}.`,
    `Review (${reviewRating}/5): "${reviewText}"`,
    `Reply style: ${style}.`,
    "Write a single short reply (2-4 sentences).",
  ].join("\n");
}

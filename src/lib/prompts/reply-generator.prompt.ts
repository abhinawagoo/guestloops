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
  "Offerable",
] as const;

/** Map venue replyTone to prompt ReplyStyle */
export function replyToneToStyle(tone: string): ReplyStyle {
  const map: Record<string, ReplyStyle> = {
    friendly: "Warm & Friendly",
    professional: "Professional",
    apologetic: "Apologetic + Recovery",
    offerable: "Offerable",
    luxury: "Luxury",
    casual: "Casual",
  };
  return (map[tone?.toLowerCase()] ?? "Warm & Friendly") as ReplyStyle;
}

export type ReplyStyle = (typeof REPLY_STYLES)[number];

export const REPLY_GENERATOR_SYSTEM = `You write short, authentic replies to Google reviews for a hospitality business. Match the requested tone. Keep replies 2-4 sentences. No hashtags or emojis unless the style is Casual. For "Offerable" style, mention a next-visit discount or offer when appropriate.`;

export function buildReplyGeneratorUserPrompt(params: {
  venueName: string;
  reviewText: string;
  reviewRating: number;
  style: ReplyStyle;
  /** Optional custom instructions from venue settings (e.g. "Always mention next visit discount"). */
  customInstructions?: string;
}): string {
  const { venueName, reviewText, reviewRating, style, customInstructions } = params;
  const parts = [
    `Venue: ${venueName}.`,
    `Review (${reviewRating}/5): "${reviewText}"`,
    `Reply style: ${style}.`,
    "Write a single short reply (2-4 sentences).",
  ];
  if (customInstructions?.trim()) {
    parts.push(`Additional instructions: ${customInstructions.trim()}`);
  }
  return parts.join("\n");
}

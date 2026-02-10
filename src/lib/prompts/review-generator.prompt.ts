/**
 * Versioned prompt for AI review generation.
 * Uses tone/length/opening randomization and anti-spam rules for natural, varied drafts.
 */
import type { ReviewStyle } from "@/lib/review-style";
import {
  getToneInstruction,
  getLengthInstruction,
  getOpeningInstruction,
  getPhraseSuppressionInstruction,
} from "@/lib/review-style";

export const REVIEW_GENERATOR_SYSTEM = `You turn customer feedback into short, authentic Google reviews for restaurants and hotels. Your output must sound like a real person wrote it — not a template or bot.

CRITICAL (Google anti-spam / naturalness):
- Vary your openings. Do NOT start with "Great experience at" every time. Use the opening style requested.
- Vary sentence length. Mix short and longer sentences in the same review.
- Use the customer's own words when they gave text (what_liked, optional note). Quote or paraphrase naturally.
- Do not stuff keywords. Weave in 1-2 natural terms (service, staff, clean, food, value) only where they fit.
- One flowing paragraph. No hashtags, no emojis, no bullet points.
- Sound like one person: consistent "we" or "I" throughout.
- Closings must vary — do not always end with "Would definitely recommend." Use the phrase suppression list.`;

export function buildReviewGeneratorUserPrompt(
  params: {
    venueName: string;
    venueType: string;
    scores: Record<string, number>;
    optionalText?: string;
    textAnswers?: Record<string, string>;
    yesNoAnswers?: Record<string, boolean>;
    recentOrderItems?: string[];
  },
  style: ReviewStyle
): string {
  const { venueName, venueType, scores, optionalText, textAnswers, yesNoAnswers, recentOrderItems } = params;
  const parts = [
    `Venue: ${venueName} (${venueType}).`,
    ``,
    `STYLE FOR THIS REVIEW (follow exactly):`,
    `- Tone: ${getToneInstruction(style.tone)}`,
    `- Length: ${getLengthInstruction(style.length)}`,
    `- Opening: ${getOpeningInstruction(style.opening, venueType)}`,
    `- ${getPhraseSuppressionInstruction()}`,
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
    parts.push(``, `WHAT THEY WROTE / CHOSE (use in the review; choices like what_did_you_get, spend_per_person, best_for are great for local SEO — e.g. "We had brunch here", "Good for families"):`);
    Object.entries(textAnswers).forEach(([k, v]) => {
      if (!v || k === "optionalText") return;
      let display = v;
      try {
        const parsed = JSON.parse(v) as unknown;
        if (Array.isArray(parsed)) display = (parsed as string[]).join(", ");
      } catch {
        // keep as-is
      }
      parts.push(`- ${k}: "${display}"`);
    });
    if (textAnswers.optionalText) parts.push(`- Additional note: "${textAnswers.optionalText}"`);
  }
  if (yesNoAnswers && Object.keys(yesNoAnswers).length > 0) {
    parts.push(``, `YES/NO:`);
    Object.entries(yesNoAnswers).forEach(([k, v]) => parts.push(`- ${k}: ${v ? "Yes" : "No"}`));
  }
  if (recentOrderItems?.length) parts.push(``, `They ordered: ${recentOrderItems.join(", ")}. Mention if it fits.`);
  parts.push(``, `Write ONE paragraph for Google. Follow the STYLE above. Opening → 1-3 points from the data → varied closing.`);
  return parts.join("\n");
}

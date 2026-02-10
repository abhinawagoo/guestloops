/**
 * Randomization for review generation: tone, length, opening style.
 * Reduces repetition and AI-pattern detection; optimizes for natural variation.
 */

export type ToneVariant = "warm" | "casual" | "brief" | "detailed" | "neutral";

export type LengthVariant = "short" | "medium" | "long";

export type OpeningStyle = "verdict" | "experience" | "visit" | "first_time" | "return" | "surprise";

export interface ReviewStyle {
  tone: ToneVariant;
  length: LengthVariant;
  opening: OpeningStyle;
}

const TONES: ToneVariant[] = ["warm", "casual", "brief", "detailed", "neutral"];
const LENGTHS: LengthVariant[] = ["short", "medium", "long"];
const OPENINGS: OpeningStyle[] = ["verdict", "experience", "visit", "first_time", "return", "surprise"];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function getRandomReviewStyle(): ReviewStyle {
  return {
    tone: pick(TONES),
    length: pick(LENGTHS),
    opening: pick(OPENINGS),
  };
}

export function getToneInstruction(tone: ToneVariant): string {
  const map: Record<ToneVariant, string> = {
    warm: "Sound warm and personal, like telling a friend. Use 'we' or 'I' naturally. Slightly enthusiastic but not over the top.",
    casual: "Keep it casual and conversational. Short sentences okay. Avoid corporate or formal phrases.",
    brief: "Be concise. 2-3 sentences max. One strong point and a quick close. No filler.",
    detailed: "Add a bit more detail — what stood out, one specific moment or dish/room. Still one paragraph.",
    neutral: "Matter-of-fact and genuine. No hype. Straightforward praise where deserved.",
  };
  return map[tone];
}

export function getLengthInstruction(length: LengthVariant): string {
  const map: Record<LengthVariant, string> = {
    short: "Write 2-3 sentences only. One opening line, one or two concrete points, one short close.",
    medium: "Write 3-5 sentences. One opening, 2-3 points from their feedback, natural closing.",
    long: "Write 4-6 sentences. Slightly more detail on what they liked. Vary sentence length.",
  };
  return map[length];
}

export function getOpeningInstruction(opening: OpeningStyle, venueType: string): string {
  const meal = venueType === "restaurant" ? "meal" : "stay";
  const map: Record<OpeningStyle, string> = {
    verdict: "Open with a clear verdict but vary the phrase: e.g. 'Really good experience at [Venue].' or 'Had a solid [meal] here.' — do NOT use 'Great experience at' every time.",
    experience: "Open with how the experience felt: e.g. 'We had a lovely time at [Venue].' or 'Nice [meal] and good vibes.'",
    visit: "Open with the visit: e.g. 'Came here for [meal] last week.' or 'Stopped by [Venue] recently.'",
    first_time: "Open as first-time visitor: e.g. 'First time at [Venue] and we were impressed.' or 'Tried [Venue] for the first time.'",
    return: "Open as returning customer: e.g. 'Been here a few times now.' or 'Back again at [Venue].'",
    surprise: "Open with a small surprise or standout: e.g. 'Didn't expect it to be this good.' or 'Pleasant surprise at [Venue].'",
  };
  return map[opening];
}

/** Phrases to avoid overusing (suppress in instructions). */
export const PHRASES_TO_VARY = [
  "Would definitely recommend",
  "Great experience",
  "Highly recommend",
  "Will be back",
  "Can't wait to return",
  "Everything was perfect",
  "Nothing to fault",
];

export function getPhraseSuppressionInstruction(): string {
  return `Avoid repeating these exact phrases; rephrase or skip: ${PHRASES_TO_VARY.slice(0, 4).join(", ")}. Use different closings (e.g. "Will come again", "Worth a visit", "Glad we came", "No complaints").`;
}

/**
 * Review quality scoring and subtle humanization for AI-generated drafts.
 * - Quality: heuristics for naturalness and anti-spam safety.
 * - Typo: very subtle, low-probability human typo simulation.
 */

import { PHRASES_TO_VARY } from "./review-style";

/** Score 0–1; higher = more natural, less spammy. */
export function scoreReviewQuality(text: string): number {
  if (!text || text.length < 20) return 0;
  let score = 1;
  const lower = text.toLowerCase();

  // Penalize overused AI phrases
  for (const phrase of PHRASES_TO_VARY) {
    if (lower.includes(phrase.toLowerCase())) score -= 0.15;
  }
  if (lower.includes("great experience")) score -= 0.1;
  if (lower.includes("highly recommend") && lower.includes("would definitely")) score -= 0.1;

  // Penalize keyword stuffing (repeated generic terms)
  const generic = ["amazing", "excellent", "perfect", "incredible", "wonderful"];
  let buzzCount = 0;
  for (const w of generic) {
    const matches = lower.match(new RegExp(`\\b${w}\\b`, "gi"));
    if (matches) buzzCount += matches.length;
  }
  if (buzzCount >= 3) score -= 0.2;
  if (buzzCount >= 5) score -= 0.2;

  // Reward sentence length variation (short + long)
  const sentences = text.split(/[.!?]+/).filter(Boolean).map((s) => s.trim().length);
  if (sentences.length >= 2) {
    const min = Math.min(...sentences);
    const max = Math.max(...sentences);
    if (max > min * 1.8) score += 0.05; // variety bonus
  }

  // Penalize very short (suspicious) or very long (spammy)
  if (text.length < 80) score -= 0.1;
  if (text.length > 400) score -= 0.1;

  return Math.max(0, Math.min(1, score));
}

const TYPO_PROBABILITY = 0.35; // 35% chance to add one subtle typo

/** Swap two adjacent chars: "the" -> "teh". */
function adjacentSwap(s: string, i: number): string {
  if (i < 0 || i >= s.length - 1) return s;
  return s.slice(0, i) + s[i + 1] + s[i] + s.slice(i + 2);
}

/** Double a character: "good" -> "goood". */
function doubleChar(s: string, i: number): string {
  if (i < 0 || i >= s.length) return s;
  return s.slice(0, i + 1) + s[i] + s.slice(i + 1);
}

/** Remove a repeated character: "really" -> "realy". */
function removeRepeat(s: string, i: number): string {
  if (i < 0 || i >= s.length - 1 || s[i] !== s[i + 1]) return s;
  return s.slice(0, i + 1) + s.slice(i + 2);
}

/** Pick a random index in a word (skip first/last to be subtle). */
function wordCharIndex(word: string): number {
  if (word.length <= 2) return 0;
  return 1 + Math.floor(Math.random() * (word.length - 2));
}

/**
 * Apply one very subtle typo with low probability.
 * Only one typo per call; prefers common "human" mistakes.
 */
export function applySubtleTypo(text: string): string {
  if (Math.random() > TYPO_PROBABILITY) return text;
  const words = text.split(/(\s+)/); // keep spaces
  const wordIndices: number[] = [];
  words.forEach((w, i) => {
    if (/^[a-zA-Z]{4,}$/.test(w)) wordIndices.push(i); // only words 4+ chars
  });
  if (wordIndices.length === 0) return text;
  const wi = wordIndices[Math.floor(Math.random() * wordIndices.length)];
  const word = words[wi];
  const idx = wordCharIndex(word);
  const ops = [
    () => adjacentSwap(word, idx),
    () => (word.length >= 5 ? doubleChar(word, idx) : word),
    () => (word.length >= 5 ? removeRepeat(word, idx) : word),
  ];
  const op = ops[Math.floor(Math.random() * ops.length)];
  const newWord = op();
  if (newWord === word) return text;
  words[wi] = newWord;
  return words.join("");
}

export const QUALITY_THRESHOLD = 0.5;

import { NextResponse } from "next/server";
import OpenAI from "openai";
import type { FeedbackScores, GeneratedReview } from "@/types/venue";
import {
  REVIEW_GENERATOR_SYSTEM,
  buildReviewGeneratorUserPrompt,
} from "@/lib/prompts/review-generator.prompt";

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      venueId,
      venueName,
      venueType,
      mobile,
      scores,
      optionalText,
      textAnswers,
      yesNoAnswers,
      recentOrderItems,
    }: {
      venueId: string;
      venueName: string;
      venueType: string;
      mobile?: string;
      scores: Partial<FeedbackScores>;
      optionalText?: string;
      textAnswers?: Record<string, string>;
      yesNoAnswers?: Record<string, boolean>;
      recentOrderItems?: string[];
    } = body;

    if (!venueName) {
      return NextResponse.json({ error: "venueName required" }, { status: 400 });
    }

    const overall = scores?.overall ?? 3;
    if (!openai) {
      return NextResponse.json(
        mockGenerate(scores, optionalText, textAnswers, yesNoAnswers, venueName)
      );
    }

    const scoresNum = {
      overall,
      ...(scores.cleanliness != null && { cleanliness: scores.cleanliness }),
      ...(scores.service != null && { service: scores.service }),
      ...(scores.foodQuality != null && { foodQuality: scores.foodQuality }),
      ...(scores.roomQuality != null && { roomQuality: scores.roomQuality }),
      ...(scores.value != null && { value: scores.value }),
    };
    const prompt = buildReviewGeneratorUserPrompt({
      venueName,
      venueType,
      scores: scoresNum,
      optionalText,
      textAnswers,
      yesNoAnswers,
      recentOrderItems,
    });
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: REVIEW_GENERATOR_SYSTEM },
        { role: "user", content: prompt },
      ],
      max_tokens: 280,
      temperature: 0.6,
    });

    const text =
      completion.choices[0]?.message?.content?.trim() ||
      mockGenerate(scores, optionalText, textAnswers, yesNoAnswers, venueName).review.text;
    const suggestedRating = Math.min(5, Math.max(1, Math.round(overall)));

    return NextResponse.json({
      review: { text, suggestedRating } as GeneratedReview,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to generate review" },
      { status: 500 }
    );
  }
}

function mockGenerate(
  scores: Partial<FeedbackScores>,
  optionalText: string | undefined,
  textAnswers: Record<string, string> | undefined,
  yesNoAnswers: Record<string, boolean> | undefined,
  venueName: string
): { review: GeneratedReview } {
  const o = scores?.overall ?? 3;
  const parts: string[] = [];
  if (o >= 4) parts.push(`Great experience at ${venueName}.`);
  else if (o <= 2) parts.push(`Visited ${venueName}.`);
  else parts.push(`Good experience at ${venueName}.`);
  if (scores?.service != null && scores.service >= 4)
    parts.push("Service was friendly and prompt.");
  if (scores?.cleanliness != null && scores.cleanliness >= 4)
    parts.push("Everything was clean and well kept.");
  if (textAnswers?.what_liked) parts.push(`Really liked ${textAnswers.what_liked}.`);
  if (optionalText) parts.push(optionalText);
  if (yesNoAnswers?.would_recommend) parts.push("Would definitely recommend.");
  return {
    review: {
      text: parts.join(" ") || `Good experience at ${venueName}. Would recommend.`,
      suggestedRating: o,
    },
  };
}

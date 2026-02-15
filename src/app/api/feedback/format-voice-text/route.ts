import { NextResponse } from "next/server";
import OpenAI from "openai";

export const dynamic = "force-dynamic";

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

/**
 * POST /api/feedback/format-voice-text
 * Body: { text: string }
 * Returns: { text: string } — formatted, punctuated, cleaned up for feedback.
 */
export async function POST(request: Request) {
  if (!openai) {
    return NextResponse.json(
      { error: "Formatting not available" },
      { status: 503 }
    );
  }
  try {
    const body = await request.json().catch(() => ({}));
    const raw = typeof body.text === "string" ? body.text.trim() : "";
    if (!raw) {
      return NextResponse.json({ text: "" }, { status: 200 });
    }
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You format voice-to-text transcripts for short customer feedback. Do only: add punctuation, fix obvious typos, remove filler words (um, uh, like). Keep the same meaning and tone. Return only the formatted text, no explanation.",
        },
        {
          role: "user",
          content: raw.slice(0, 2000),
        },
      ],
      max_tokens: 500,
      temperature: 0.2,
    });
    const formatted =
      completion.choices[0]?.message?.content?.trim() || raw;
    return NextResponse.json({ text: formatted });
  } catch (e) {
    console.error("[feedback/format-voice-text]", e);
    return NextResponse.json(
      { error: "Failed to format text" },
      { status: 500 }
    );
  }
}

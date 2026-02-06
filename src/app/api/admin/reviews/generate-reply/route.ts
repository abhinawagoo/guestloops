import { NextResponse } from "next/server";
import OpenAI from "openai";
import { requireAdminTenant } from "@/lib/require-admin-tenant";
import { getVenueForTenant } from "@/data/tenants";
import { getVenuesByTenantIdAsync } from "@/lib/tenant-resolver";
import { createClient } from "@/lib/supabase/server";
import { getSettings } from "@/data/venue-settings";
import {
  REPLY_GENERATOR_SYSTEM,
  buildReplyGeneratorUserPrompt,
  replyToneToStyle,
  type ReplyStyle,
} from "@/lib/prompts/reply-generator.prompt";

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export async function POST(request: Request) {
  try {
    const admin = await requireAdminTenant();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const body = await request.json();
    const { venueId, reviewText, reviewRating }: { venueId: string; reviewText: string; reviewRating: number } = body;
    if (!venueId || reviewText == null) {
      return NextResponse.json(
        { error: "venueId and reviewText required" },
        { status: 400 }
      );
    }

    let venue = getVenueForTenant(admin.tenantId, venueId);
    if (!venue) {
      const supabase = await createClient();
      const venues = await getVenuesByTenantIdAsync(admin.tenantId, supabase ?? undefined);
      venue = venues.find((v) => v.id === venueId) ?? null;
    }
    if (!venue) {
      return NextResponse.json({ error: "Venue not found" }, { status: 404 });
    }

    const settings = getSettings(venueId);
    const tone = settings?.replyTone ?? "friendly";
    const style = replyToneToStyle(tone) as ReplyStyle;
    const rating = typeof reviewRating === "number" ? Math.min(5, Math.max(1, reviewRating)) : 3;

    if (!openai) {
      return NextResponse.json({
        reply: `Thank you for your feedback. We're glad you visited ${venue.name}. We hope to see you again soon.`,
      });
    }

    const prompt = buildReplyGeneratorUserPrompt({
      venueName: venue.name,
      reviewText: String(reviewText).slice(0, 2000),
      reviewRating: rating,
      style,
      customInstructions: settings?.replyInstructions,
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: REPLY_GENERATOR_SYSTEM },
        { role: "user", content: prompt },
      ],
      max_tokens: 180,
      temperature: 0.5,
    });

    const reply =
      completion.choices[0]?.message?.content?.trim() ||
      `Thank you for your feedback. We hope to see you again at ${venue.name}.`;

    return NextResponse.json({ reply });
  } catch (e) {
    console.error("[admin/reviews/generate-reply]", e);
    return NextResponse.json(
      { error: "Failed to generate reply" },
      { status: 500 }
    );
  }
}

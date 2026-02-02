import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { FeedbackScores } from "@/types/venue";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      venueId,
      tenantId,
      mobile,
      scores,
      textAnswers,
      yesNoAnswers,
      optionalText,
      imageUrls,
      sessionId,
      generatedReviewText,
      reviewOutcome,
    }: {
      venueId: string;
      tenantId: string;
      mobile?: string;
      scores: Partial<FeedbackScores>;
      textAnswers?: Record<string, string>;
      yesNoAnswers?: Record<string, boolean>;
      optionalText?: string;
      imageUrls?: string[];
      sessionId?: string;
      generatedReviewText?: string;
      reviewOutcome?: "google_redirect" | "private";
    } = body;

    if (!venueId || !tenantId) {
      return NextResponse.json(
        { error: "venueId and tenantId required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({ ok: true, saved: false });
    }

    let resolvedTenantId: string | null = null;
    if (UUID_REGEX.test(tenantId)) {
      resolvedTenantId = tenantId;
    } else {
      const { data: tenant } = await supabase
        .from("tenants")
        .select("id")
        .eq("slug", tenantId)
        .single();
      resolvedTenantId = tenant?.id ?? null;
    }

    if (!resolvedTenantId) {
      return NextResponse.json({ ok: true, saved: false });
    }

    const { data: row, error } = await supabase
      .from("feedback_submissions")
      .insert({
        venue_id: venueId,
        tenant_id: resolvedTenantId,
        mobile: mobile ?? null,
        scores: scores ?? {},
        text_answers: textAnswers ?? {},
        yes_no_answers: yesNoAnswers ?? {},
        optional_text: optionalText ?? null,
        image_urls: imageUrls ?? null,
        session_id: sessionId ?? null,
        generated_review_text: generatedReviewText ?? null,
        review_outcome: reviewOutcome ?? null,
      })
      .select("id")
      .single();

    if (error) {
      console.error("[feedback/submit]", error);
      return NextResponse.json(
        { error: "Failed to save feedback", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, saved: true, id: row?.id });
  } catch (e) {
    console.error("[feedback/submit]", e);
    return NextResponse.json(
      { error: "Failed to save feedback" },
      { status: 500 }
    );
  }
}

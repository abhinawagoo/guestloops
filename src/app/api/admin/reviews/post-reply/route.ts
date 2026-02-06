import { NextResponse } from "next/server";
import { requireAdminTenant } from "@/lib/require-admin-tenant";
import { getValidAccessTokenForTenant } from "@/lib/google-business";
import { updateReviewReply } from "@/lib/google-business";
import { createAdminClient } from "@/lib/supabase/admin";
import { getVenuesByTenantIdAsync } from "@/lib/tenant-resolver";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const admin = await requireAdminTenant();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const { venueId, googleReviewId, replyText } = body as {
    venueId?: string;
    googleReviewId?: string;
    replyText?: string;
  };

  if (!venueId || !googleReviewId || replyText == null || String(replyText).trim() === "") {
    return NextResponse.json(
      { error: "venueId, googleReviewId, and replyText required" },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const venues = await getVenuesByTenantIdAsync(admin.tenantId, supabase ?? undefined);
  if (!venues.some((v) => v.id === venueId)) {
    return NextResponse.json({ error: "Venue not found" }, { status: 404 });
  }

  const db = createAdminClient();
  if (!db) return NextResponse.json({ error: "Database error" }, { status: 500 });

  const { data: reviewRow, error: fetchError } = await db
    .from("google_reviews")
    .select("gbp_review_name, tenant_id")
    .eq("id", googleReviewId)
    .eq("venue_id", venueId)
    .eq("tenant_id", admin.tenantId)
    .single();

  if (fetchError || !reviewRow) {
    return NextResponse.json({ error: "Google review not found" }, { status: 404 });
  }

  const gbpReviewName = (reviewRow as { gbp_review_name: string }).gbp_review_name;
  const accessToken = await getValidAccessTokenForTenant(admin.tenantId);
  if (!accessToken) {
    return NextResponse.json({ error: "Google not connected" }, { status: 400 });
  }

  try {
    await updateReviewReply(accessToken, gbpReviewName, String(replyText).trim());
  } catch (e) {
    console.error("[admin/reviews/post-reply]", e);
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 500 }
    );
  }

  const now = new Date().toISOString();
  await db
    .from("google_reviews")
    .update({
      review_reply: String(replyText).trim(),
      replied_at: now,
      updated_at: now,
    })
    .eq("id", googleReviewId);

  return NextResponse.json({ ok: true });
}

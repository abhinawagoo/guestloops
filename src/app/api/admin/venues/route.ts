import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getTenantFromHeaders } from "@/lib/tenant";
import { getVenuesByTenantIdAsync, getTenantBySlugAsync } from "@/lib/tenant-resolver";
import { createVenueForTenant } from "@/data/tenants";
import type { Venue } from "@/types/venue";

const DEFAULT_UI_TEXT = {
  welcomeSubtitle: "Scan to explore or share your experience",
  feedbackCardTitle: "Give Feedback & Unlock Reward",
  feedbackCardSubtitle: "Quick taps — we'll turn it into a Google review.",
  rewardCta: "Win 10% off your next visit",
  claimRewardLabel: "I'm done — claim my reward",
  thanksTitle: "Thanks!",
};

export const dynamic = "force-dynamic";

/** GET: list venues for current tenant (same source as settings page). */
export async function GET() {
  const headersList = await headers();
  const ctx = getTenantFromHeaders(headersList);
  if (ctx.hostType !== "tenant") {
    return NextResponse.json({ error: "Tenant required" }, { status: 403 });
  }

  let tenantId = ctx.tenantId;
  if (!tenantId && ctx.tenantSlug) {
    const tenant = await getTenantBySlugAsync(ctx.tenantSlug);
    tenantId = tenant?.id ?? null;
  }
  if (!tenantId) {
    return NextResponse.json({ venues: [] });
  }

  const supabase = await createClient();
  const venues = await getVenuesByTenantIdAsync(tenantId, supabase ?? undefined);
  return NextResponse.json({ venues });
}

/** POST: create a venue for the current tenant. */
export async function POST(request: Request) {
  const headersList = await headers();
  const ctx = getTenantFromHeaders(headersList);
  if (ctx.hostType !== "tenant") {
    return NextResponse.json({ error: "Tenant required" }, { status: 403 });
  }

  let body: { name?: string; type?: "restaurant" | "hotel" };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const name = body.name?.trim();
  const type = body.type ?? "restaurant";
  if (!name || name.length < 1) {
    return NextResponse.json({ error: "Venue name is required" }, { status: 400 });
  }

  let tenantId = ctx.tenantId;
  if (!tenantId && ctx.tenantSlug) {
    const tenant = await getTenantBySlugAsync(ctx.tenantSlug);
    tenantId = tenant?.id ?? null;
  }
  if (!tenantId) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  const supabase = await createClient();
  if (supabase) {
    const { data: venueRow, error: venueErr } = await supabase
      .from("venues")
      .insert({
        tenant_id: tenantId,
        name,
        type,
      })
      .select("id, name, type")
      .single();

    if (venueErr || !venueRow) {
      console.error("[admin/venues] insert:", venueErr);
      return NextResponse.json(
        { error: venueErr?.message ?? "Failed to create venue" },
        { status: 500 }
      );
    }

    await supabase.from("venue_settings").insert({
      venue_id: venueRow.id,
      show_menu: true,
      show_services: true,
      ui_text: DEFAULT_UI_TEXT,
      custom_questions: [],
      menu_items: [],
      service_items: [],
    });

    const venue: Venue = {
      id: String(venueRow.id),
      tenantId,
      name: String(venueRow.name),
      type: (venueRow.type as Venue["type"]) ?? "restaurant",
    };
    return NextResponse.json({ venue });
  }

  // In-memory fallback
  const venue = createVenueForTenant(tenantId, { name, type });
  if (!venue) {
    return NextResponse.json({ error: "Failed to create venue" }, { status: 500 });
  }
  return NextResponse.json({ venue });
}

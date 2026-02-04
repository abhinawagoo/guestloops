import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { getSettings, setSettings } from "@/data/venue-settings";
import { getTenantFromHeaders } from "@/lib/tenant";
import { getVenueForTenant } from "@/data/tenants";
import { getTenantBySlugAsync } from "@/lib/tenant-resolver";
import { createClient } from "@/lib/supabase/server";
import type { VenueSettings } from "@/types/venue";
import { rowToVenueSettings, type VenueSettingsRow } from "@/data/venue-settings-db";

function patchToRow(venueId: string, patch: Partial<VenueSettings>): Partial<VenueSettingsRow> {
  const row: Partial<VenueSettingsRow> = { venue_id: venueId };
  if (patch.showMenu !== undefined) row.show_menu = patch.showMenu;
  if (patch.showServices !== undefined) row.show_services = patch.showServices;
  if (patch.uiText !== undefined) row.ui_text = patch.uiText as Record<string, unknown>;
  if (patch.customQuestions !== undefined) row.custom_questions = patch.customQuestions as unknown[];
  if (patch.menuItems !== undefined) row.menu_items = patch.menuItems as unknown[];
  if (patch.serviceItems !== undefined) row.service_items = patch.serviceItems as unknown[];
  if (patch.menuCategories !== undefined) row.menu_categories = patch.menuCategories as unknown[];
  if (patch.serviceCategories !== undefined) row.service_categories = patch.serviceCategories as unknown[];
  if (patch.googleReviewUrl !== undefined) row.google_review_url = patch.googleReviewUrl || null;
  if (patch.defaultRatingStyle !== undefined) row.default_rating_style = patch.defaultRatingStyle || null;
  if (patch.replyTone !== undefined) row.reply_tone = patch.replyTone || null;
  if (patch.replyInstructions !== undefined) row.reply_instructions = patch.replyInstructions || null;
  return row;
}

/** Resolve tenant id from headers (proxy sets it) or by slug. */
async function resolveTenantId(ctx: { tenantId: string | null; tenantSlug: string | null }): Promise<string | null> {
  if (ctx.tenantId) return ctx.tenantId;
  if (!ctx.tenantSlug) return null;
  const tenant = await getTenantBySlugAsync(ctx.tenantSlug);
  return tenant?.id ?? null;
}

/** Verify venue belongs to tenant: in-memory first, then Supabase. */
async function ensureVenueBelongsToTenant(
  tenantId: string,
  venueId: string,
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<boolean> {
  const fromMemory = getVenueForTenant(tenantId, venueId);
  if (fromMemory) return true;
  if (!supabase) return false;
  const { data, error } = await supabase
    .from("venues")
    .select("id")
    .eq("id", venueId)
    .eq("tenant_id", tenantId)
    .maybeSingle();
  return !error && !!data;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ venueId: string }> }
) {
  const headersList = await headers();
  const ctx = getTenantFromHeaders(headersList);
  const { venueId } = await params;
  if (!venueId) return NextResponse.json({ error: "venueId required" }, { status: 400 });
  if (ctx.hostType !== "tenant") return NextResponse.json({ error: "Tenant required" }, { status: 403 });

  const tenantId = await resolveTenantId(ctx);
  if (!tenantId) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  const supabase = await createClient();
  const allowed = await ensureVenueBelongsToTenant(tenantId, venueId, supabase);
  if (!allowed) return NextResponse.json({ error: "Venue not found" }, { status: 404 });

  if (supabase) {
    const { data: row, error } = await supabase
      .from("venue_settings")
      .select("*")
      .eq("venue_id", venueId)
      .maybeSingle();
    if (!error && row) {
      return NextResponse.json(rowToVenueSettings(row as VenueSettingsRow));
    }
  }

  const settings = getSettings(venueId);
  return NextResponse.json(settings);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ venueId: string }> }
) {
  const headersList = await headers();
  const ctx = getTenantFromHeaders(headersList);
  const { venueId } = await params;
  if (!venueId) return NextResponse.json({ error: "venueId required" }, { status: 400 });
  if (ctx.hostType !== "tenant") return NextResponse.json({ error: "Tenant required" }, { status: 403 });

  const tenantId = await resolveTenantId(ctx);
  if (!tenantId) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  const supabase = await createClient();
  const allowed = await ensureVenueBelongsToTenant(tenantId, venueId, supabase);
  if (!allowed) return NextResponse.json({ error: "Venue not found" }, { status: 404 });

  let body: Partial<VenueSettings>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (supabase) {
    const { data: existing } = await supabase
      .from("venue_settings")
      .select("*")
      .eq("venue_id", venueId)
      .maybeSingle();

    const row = patchToRow(venueId, body);
    const { venue_id: _, ...updatePayload } = row;

    if (existing) {
      const { data: updated, error } = await supabase
        .from("venue_settings")
        .update({
          ...updatePayload,
          updated_at: new Date().toISOString(),
        })
        .eq("venue_id", venueId)
        .select()
        .single();
      if (error) {
        console.error("[admin/settings] update:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json(rowToVenueSettings(updated as VenueSettingsRow));
    }

    const { data: inserted, error } = await supabase
      .from("venue_settings")
      .insert({
        venue_id: venueId,
        show_menu: body.showMenu ?? true,
        show_services: body.showServices ?? true,
        ui_text: body.uiText ?? {},
        custom_questions: body.customQuestions ?? [],
        menu_items: body.menuItems ?? [],
        service_items: body.serviceItems ?? [],
        menu_categories: body.menuCategories ?? [],
        service_categories: body.serviceCategories ?? [],
        google_review_url: body.googleReviewUrl ?? null,
        default_rating_style: body.defaultRatingStyle ?? null,
        reply_tone: body.replyTone ?? null,
        reply_instructions: body.replyInstructions ?? null,
      })
      .select()
      .single();
    if (error) {
      console.error("[admin/settings] insert:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(rowToVenueSettings(inserted as VenueSettingsRow));
  }

  const updated = setSettings(venueId, body);
  return NextResponse.json(updated);
}

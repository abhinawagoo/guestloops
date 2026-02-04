import type { Venue } from "@/types/venue";
import type { VenueSettings } from "@/types/venue";
import { getSettings } from "@/data/venue-settings";
import { getVenueById as getVenueFromTenants } from "@/data/tenants";
import { rowToVenueSettings, type VenueSettingsRow } from "@/data/venue-settings-db";
import { createAdminClient } from "@/lib/supabase/admin";

/** @deprecated Use getVenueFromTenants from @/data/tenants for multi-tenant. */
export function getVenue(venueId: string): Venue | null {
  return getVenueFromTenants(venueId);
}

/** Venue + settings merged for public QR/feedback pages */
export interface VenueWithSettings extends Venue {
  settings: VenueSettings;
}

export function getVenueWithSettings(venueId: string): VenueWithSettings | null {
  const venue = getVenue(venueId);
  if (!venue) return null;
  const settings = getSettings(venueId);
  return { ...venue, settings };
}

/** Load venue + settings from Supabase when in-memory has no data (e.g. production). Use in server components. */
export async function getVenueWithSettingsAsync(venueId: string): Promise<VenueWithSettings | null> {
  const fromMemory = getVenueWithSettings(venueId);
  if (fromMemory) return fromMemory;

  const supabase = createAdminClient();
  if (!supabase) return null;

  const { data: venueRow, error: venueErr } = await supabase
    .from("venues")
    .select("*")
    .eq("id", venueId)
    .maybeSingle();
  if (venueErr || !venueRow) return null;

  const venue: Venue = {
    id: String(venueRow.id),
    tenantId: String(venueRow.tenant_id),
    name: String(venueRow.name),
    type: (venueRow.type as Venue["type"]) ?? "restaurant",
    googlePlaceId: venueRow.google_place_id != null ? String(venueRow.google_place_id) : undefined,
    rewardCta: venueRow.reward_cta != null ? String(venueRow.reward_cta) : undefined,
  };

  const { data: settingsRow, error: settingsErr } = await supabase
    .from("venue_settings")
    .select("*")
    .eq("venue_id", venueId)
    .maybeSingle();
  if (settingsErr) return { ...venue, settings: getSettings(venueId) };
  const settings = settingsRow
    ? rowToVenueSettings(settingsRow as VenueSettingsRow)
    : getSettings(venueId);

  return { ...venue, settings };
}

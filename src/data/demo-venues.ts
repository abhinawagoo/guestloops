import type { Venue } from "@/types/venue";
import { getSettings } from "@/data/venue-settings";
import { getVenueById as getVenueFromTenants } from "@/data/tenants";

/** @deprecated Use getVenueFromTenants from @/data/tenants for multi-tenant. */
export function getVenue(venueId: string): Venue | null {
  return getVenueFromTenants(venueId);
}

/** Venue + settings merged for public QR/feedback pages */
export interface VenueWithSettings extends Venue {
  settings: ReturnType<typeof getSettings>;
}

export function getVenueWithSettings(venueId: string): VenueWithSettings | null {
  const venue = getVenue(venueId);
  if (!venue) return null;
  const settings = getSettings(venueId);
  return { ...venue, settings };
}

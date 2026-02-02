import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { getSettings, setSettings } from "@/data/venue-settings";
import { getTenantFromHeaders } from "@/lib/tenant";
import { getVenueForTenant } from "@/data/tenants";
import type { VenueSettings } from "@/types/venue";

async function requireTenantVenue(tenantId: string | null, venueId: string) {
  if (!tenantId) return NextResponse.json({ error: "Tenant required" }, { status: 403 });
  const venue = getVenueForTenant(tenantId, venueId);
  if (!venue) return NextResponse.json({ error: "Venue not found" }, { status: 404 });
  return null;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ venueId: string }> }
) {
  const headersList = await headers();
  const ctx = getTenantFromHeaders(headersList);
  const { venueId } = await params;
  if (!venueId) return NextResponse.json({ error: "venueId required" }, { status: 400 });
  const err = await requireTenantVenue(ctx.tenantId, venueId);
  if (err) return err;
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
  const err = await requireTenantVenue(ctx.tenantId, venueId);
  if (err) return err;
  let body: Partial<VenueSettings>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const updated = setSettings(venueId, body);
  return NextResponse.json(updated);
}

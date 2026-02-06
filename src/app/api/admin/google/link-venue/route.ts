import { NextResponse } from "next/server";
import { requireAdminTenant } from "@/lib/require-admin-tenant";
import { createAdminClient } from "@/lib/supabase/admin";
import { getVenuesByTenantIdAsync } from "@/lib/tenant-resolver";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const admin = await requireAdminTenant();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const { venueId, gbpAccountId, gbpLocationId, gbpLocationName } = body as {
    venueId?: string;
    gbpAccountId?: string;
    gbpLocationId?: string;
    gbpLocationName?: string;
  };

  if (!venueId || !gbpAccountId || !gbpLocationId) {
    return NextResponse.json(
      { error: "venueId, gbpAccountId, gbpLocationId required" },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const venues = await getVenuesByTenantIdAsync(admin.tenantId, supabase ?? undefined);
  const venue = venues.find((v) => v.id === venueId);
  if (!venue) {
    return NextResponse.json({ error: "Venue not found" }, { status: 404 });
  }

  const db = createAdminClient();
  if (!db) return NextResponse.json({ error: "Database error" }, { status: 500 });

  const { error } = await db.from("venue_gbp_locations").upsert(
    {
      venue_id: venueId,
      tenant_id: admin.tenantId,
      gbp_account_id: gbpAccountId,
      gbp_location_id: gbpLocationId,
      gbp_location_name: gbpLocationName ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "venue_id" }
  );

  if (error) {
    console.error("[admin/google/link-venue]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

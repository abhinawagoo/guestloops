import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getTenantFromHeaders } from "@/lib/tenant";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const headersList = await headers();
  const ctx = getTenantFromHeaders(headersList);
  if (ctx.hostType !== "tenant" || !ctx.tenantId) {
    return NextResponse.json({ error: "Tenant required" }, { status: 403 });
  }

  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ connected: false, venuesWithGbp: [] });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ connected: false, venuesWithGbp: [] });

  const { data: profile } = await supabase
    .from("profiles")
    .select("tenant_id")
    .eq("id", user.id)
    .single();
  const tenantId = profile?.tenant_id ?? ctx.tenantId;
  if (!tenantId) return NextResponse.json({ connected: false, venuesWithGbp: [] });

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ connected: false, venuesWithGbp: [] });

  const { data: tokenRow } = await admin
    .from("google_oauth_tokens")
    .select("tenant_id")
    .eq("tenant_id", tenantId)
    .single();

  const { data: links } = await admin
    .from("venue_gbp_locations")
    .select("venue_id")
    .eq("tenant_id", tenantId);

  const venuesWithGbp = (links ?? []).map((r: { venue_id: string }) => r.venue_id);

  return NextResponse.json({
    connected: !!tokenRow,
    venuesWithGbp,
  });
}

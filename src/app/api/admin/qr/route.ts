import { NextResponse } from "next/server";
import { headers } from "next/headers";
import QRCode from "qrcode";
import { getTenantFromHeaders } from "@/lib/tenant";
import { getTenantBySlugAsync } from "@/lib/tenant-resolver";
import { getVenueForTenant } from "@/data/tenants";
import { createClient } from "@/lib/supabase/server";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

async function resolveTenantId(ctx: { tenantId: string | null; tenantSlug: string | null }) {
  if (ctx.tenantId) return ctx.tenantId;
  if (!ctx.tenantSlug) return null;
  const tenant = await getTenantBySlugAsync(ctx.tenantSlug);
  return tenant?.id ?? null;
}

async function ensureVenueBelongsToTenant(
  tenantId: string,
  venueId: string,
  supabase: Awaited<ReturnType<typeof createClient>>
) {
  if (getVenueForTenant(tenantId, venueId)) return true;
  if (!supabase) return false;
  const { data, error } = await supabase
    .from("venues")
    .select("id")
    .eq("id", venueId)
    .eq("tenant_id", tenantId)
    .maybeSingle();
  return !error && !!data;
}

/** GET ?venueId=xxx returns PNG QR code for feedback URL. Requires tenant context. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const venueId = searchParams.get("venueId");
  if (!venueId) return NextResponse.json({ error: "venueId required" }, { status: 400 });

  const headersList = await headers();
  const ctx = getTenantFromHeaders(headersList);
  if (ctx.hostType !== "tenant") return NextResponse.json({ error: "Tenant required" }, { status: 403 });

  const tenantId = await resolveTenantId(ctx);
  if (!tenantId) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  const supabase = await createClient();
  const allowed = await ensureVenueBelongsToTenant(tenantId, venueId, supabase);
  if (!allowed) return NextResponse.json({ error: "Venue not found" }, { status: 404 });

  const feedbackUrl = baseUrl ? `${baseUrl.replace(/\/$/, "")}/q/${venueId}/feedback` : "";
  if (!feedbackUrl) return NextResponse.json({ error: "App URL not configured" }, { status: 500 });

  try {
    const png = await QRCode.toBuffer(feedbackUrl, { type: "png", width: 280, margin: 2 });
    const body = new Uint8Array(png);
    return new NextResponse(body, {
      headers: {
        "Content-Type": "image/png",
        "Content-Length": String(body.length),
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (e) {
    console.error("[admin/qr]", e);
    return NextResponse.json({ error: "Failed to generate QR" }, { status: 500 });
  }
}

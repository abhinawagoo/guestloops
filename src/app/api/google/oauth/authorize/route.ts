import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getTenantFromHeaders } from "@/lib/tenant";
import { getTenantByIdAsync, getTenantBySlugAsync } from "@/lib/tenant-resolver";
import { createClient } from "@/lib/supabase/server";
import { getGoogleOAuthAuthorizeUrl } from "@/lib/google-business";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const venueId = searchParams.get("venueId") ?? "";
  const headersList = await headers();
  const ctx = getTenantFromHeaders(headersList);
  if (ctx.hostType !== "tenant") {
    return NextResponse.json({ error: "Tenant context required" }, { status: 403 });
  }

  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Auth required" }, { status: 401 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/signin?next=" + encodeURIComponent(request.url), request.url));
  }

  let tenantId: string | null = null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("tenant_id")
    .eq("id", user.id)
    .single();
  if (profile?.tenant_id) tenantId = profile.tenant_id;
  if (!tenantId && ctx.tenantId) tenantId = ctx.tenantId;
  if (!tenantId && ctx.tenantSlug) {
    const tenant = await getTenantBySlugAsync(ctx.tenantSlug);
    tenantId = tenant?.id ?? null;
  }
  if (!tenantId) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 403 });
  }

  const origin = request.headers.get("origin") ?? new URL(request.url).origin;
  const redirectUri = `${origin}/api/google/oauth/callback`;
  const state = [tenantId, venueId].filter(Boolean).join("|");

  const url = getGoogleOAuthAuthorizeUrl(redirectUri, state);
  return NextResponse.redirect(url);
}

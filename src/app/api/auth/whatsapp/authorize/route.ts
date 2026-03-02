import { NextResponse } from "next/server";
import { requireAdminTenant } from "@/lib/require-admin-tenant";

export const dynamic = "force-dynamic";

const GRAPH_VERSION = "v22.0";

/**
 * GET /api/auth/whatsapp/authorize
 * Redirects to Meta OAuth for WhatsApp Embedded Signup.
 * Uses a FIXED callback URL so you only need ONE redirect URI in Meta (scales for all tenants).
 */
export async function GET(request: Request) {
  const ctx = await requireAdminTenant();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const appId = process.env.META_APP_ID ?? process.env.NEXT_PUBLIC_META_APP_ID;
  const configId = process.env.NEXT_PUBLIC_META_WHATSAPP_CONFIG_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!appId || !configId || !appUrl) {
    return NextResponse.json(
      { error: "META_APP_ID, NEXT_PUBLIC_META_WHATSAPP_CONFIG_ID, and NEXT_PUBLIC_APP_URL must be set" },
      { status: 500 }
    );
  }

  // Single callback URL - add only this to Meta's Valid OAuth Redirect URIs
  const redirectUri = `${appUrl.replace(/\/$/, "")}/api/auth/whatsapp/callback`;
  const state = ctx.tenantId;

  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    state,
    response_type: "code",
    config_id: configId,
    scope: "business_management,whatsapp_business_management,whatsapp_business_messaging",
  });

  const authUrl = `https://www.facebook.com/${GRAPH_VERSION}/dialog/oauth?${params}`;
  return NextResponse.redirect(authUrl);
}

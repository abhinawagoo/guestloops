import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  exchangeCodeForWhatsAppToken,
  fetchWabaAndPhone,
} from "@/lib/meta-whatsapp";
import { getTenantByIdAsync } from "@/lib/tenant-resolver";

export const dynamic = "force-dynamic";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://guestloops.com";
const baseSettingsUrl = `${appUrl.replace(/\/$/, "")}/admin/settings`;

/**
 * Validate required env vars for WhatsApp callback.
 * redirect_uri used in code exchange must EXACTLY match Meta OAuth config.
 */
function validateEnv(): { ok: boolean; message?: string } {
  const appId = process.env.META_APP_ID ?? process.env.NEXT_PUBLIC_META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  const redirectUri = `${appUrl.replace(/\/$/, "")}/api/auth/whatsapp/callback`;

  if (!appId) return { ok: false, message: "META_APP_ID or NEXT_PUBLIC_META_APP_ID not set" };
  if (!appSecret) return { ok: false, message: "META_APP_SECRET not set" };

  const configuredRedirect = process.env.META_WHATSAPP_REDIRECT_URI;
  if (configuredRedirect && configuredRedirect !== redirectUri) {
    console.warn(
      "[whatsapp/callback] META_WHATSAPP_REDIRECT_URI mismatch:",
      "env=",
      configuredRedirect,
      "expected=",
      redirectUri
    );
  }

  return { ok: true };
}

/**
 * GET /api/auth/whatsapp/callback
 * Meta redirects here after user completes WhatsApp Embedded Signup.
 * Exchange code for token, fetch WABA + phone, store in whatsapp_accounts, redirect to settings.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const errorDescription = url.searchParams.get("error_description");

  if (error) {
    const msg = errorDescription ?? error;
    console.error("[whatsapp/callback] Meta OAuth error:", { error, error_description: errorDescription });
    return NextResponse.redirect(
      `${baseSettingsUrl}?whatsapp=error&message=${encodeURIComponent(msg)}`
    );
  }

  if (!code || !state) {
    console.error("[whatsapp/callback] Missing code or state:", { hasCode: !!code, hasState: !!state });
    return NextResponse.redirect(`${baseSettingsUrl}?whatsapp=missing`);
  }

  const envCheck = validateEnv();
  if (!envCheck.ok) {
    console.error("[whatsapp/callback] Env validation failed:", envCheck.message);
    return NextResponse.redirect(
      `${baseSettingsUrl}?whatsapp=error&message=${encodeURIComponent(envCheck.message ?? "Configuration error")}`
    );
  }

  const tenantId = state;
  const tenant = await getTenantByIdAsync(tenantId);

  const redirectUri = `${appUrl.replace(/\/$/, "")}/api/auth/whatsapp/callback`;

  try {
    const { access_token } = await exchangeCodeForWhatsAppToken(code, redirectUri);

    if (!access_token) {
      console.error("[whatsapp/callback] Token exchange returned no access_token");
      return NextResponse.redirect(
        `${baseSettingsUrl}?whatsapp=error&message=${encodeURIComponent("Token exchange failed")}`
      );
    }

    const accountData = await fetchWabaAndPhone(access_token);

    if (!accountData) {
      return NextResponse.redirect(
        `${baseSettingsUrl}?whatsapp=error&message=${encodeURIComponent("Could not fetch WhatsApp Business Account")}`
      );
    }

    const admin = createAdminClient();
    if (!admin) {
      return NextResponse.redirect(`${baseSettingsUrl}?whatsapp=error`);
    }

    await admin.from("whatsapp_accounts").upsert(
      {
        tenant_id: tenantId,
        waba_id: accountData.waba_id,
        phone_number_id: accountData.phone_number_id,
        display_name: accountData.display_name,
        access_token: accountData.access_token,
        status: "active",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "tenant_id" }
    );

    const tenantSlug = tenant?.slug ?? tenantId;
    return NextResponse.redirect(
      `${baseSettingsUrl}?tenant=${encodeURIComponent(tenantSlug)}&whatsapp=connected`
    );
  } catch (e) {
    const err = e as Error;
    const message = err.message ?? "Unknown error";
    console.error("[whatsapp/callback] Error:", message, err);
    return NextResponse.redirect(
      `${baseSettingsUrl}?whatsapp=error&message=${encodeURIComponent(message)}`
    );
  }
}

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  exchangeCodeForWhatsAppToken,
  fetchWabaAndPhone,
} from "@/lib/meta-whatsapp";
import { getTenantByIdAsync } from "@/lib/tenant-resolver";

export const dynamic = "force-dynamic";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://guestloops.com";

/**
 * GET /api/auth/whatsapp/callback
 * Meta redirects here after user completes WhatsApp Embedded Signup.
 * Exchange code for token, store in whatsapp_accounts, redirect to settings.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const errorDescription = url.searchParams.get("error_description");

  const baseSettingsUrl = `${appUrl.replace(/\/$/, "")}/admin/settings`;

  if (error) {
    const msg = errorDescription ?? error;
    return NextResponse.redirect(
      `${baseSettingsUrl}?whatsapp=error&message=${encodeURIComponent(msg)}`
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(`${baseSettingsUrl}?whatsapp=missing`);
  }

  // state = tenantId (UUID)
  const tenantId = state;
  const tenant = await getTenantByIdAsync(tenantId);

  const redirectUri = `${appUrl.replace(/\/$/, "")}/api/auth/whatsapp/callback`;

  try {
    const { access_token } = await exchangeCodeForWhatsAppToken(code, redirectUri);
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
    console.error("[whatsapp/callback]", e);
    return NextResponse.redirect(
      `${baseSettingsUrl}?whatsapp=error&message=${encodeURIComponent((e as Error).message)}`
    );
  }
}

import { NextResponse } from "next/server";
import { requireAdminTenant } from "@/lib/require-admin-tenant";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  exchangeCodeForWhatsAppToken,
  fetchWabaAndPhone,
  type WhatsAppAccountData,
} from "@/lib/meta-whatsapp";

export const dynamic = "force-dynamic";

type ConnectBody =
  | { code: string; redirect_uri?: string }
  | {
      waba_id: string;
      phone_number_id: string;
      display_name: string;
      access_token: string;
    };

function isCodePayload(body: ConnectBody): body is { code: string } {
  return "code" in body && typeof (body as { code: string }).code === "string";
}

function isDirectPayload(body: ConnectBody): body is WhatsAppAccountData {
  return (
    "waba_id" in body &&
    "phone_number_id" in body &&
    "access_token" in body &&
    typeof (body as WhatsAppAccountData).waba_id === "string" &&
    typeof (body as WhatsAppAccountData).phone_number_id === "string" &&
    typeof (body as WhatsAppAccountData).access_token === "string"
  );
}

/**
 * POST /api/admin/whatsapp/connect
 * Connect tenant's WhatsApp via Meta Embedded Signup.
 *
 * Body (option A - code exchange):
 *   { code: string } — auth code from FB.login Embedded Signup
 *
 * Body (option B - direct from session info):
 *   { waba_id, phone_number_id, display_name, access_token }
 */
export async function POST(request: Request) {
  const ctx = await requireAdminTenant();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  let body: ConnectBody;
  try {
    body = (await request.json()) as ConnectBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  let accountData: WhatsAppAccountData;

  if (isCodePayload(body)) {
    if (!body.code.trim()) {
      return NextResponse.json({ error: "Missing code" }, { status: 400 });
    }
    try {
      const redirectUri = "redirect_uri" in body ? body.redirect_uri : undefined;
      const { access_token } = await exchangeCodeForWhatsAppToken(body.code, redirectUri);
      const fetched = await fetchWabaAndPhone(access_token);
      if (!fetched) {
        return NextResponse.json(
          { error: "Could not fetch WhatsApp Business Account. Ensure your Meta App has WhatsApp Embedded Signup configured." },
          { status: 400 }
        );
      }
      accountData = fetched;
    } catch (e) {
      console.error("[whatsapp/connect] code exchange failed:", e);
      return NextResponse.json(
        { error: (e as Error).message ?? "Failed to connect WhatsApp" },
        { status: 400 }
      );
    }
  } else if (isDirectPayload(body)) {
    accountData = {
      waba_id: body.waba_id,
      phone_number_id: body.phone_number_id,
      display_name: body.display_name ?? "WhatsApp",
      access_token: body.access_token,
    };
  } else {
    return NextResponse.json(
      { error: "Provide either { code } or { waba_id, phone_number_id, display_name, access_token }" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "Database unavailable" }, { status: 500 });

  const { error } = await admin.from("whatsapp_accounts").upsert(
    {
      tenant_id: ctx.tenantId,
      waba_id: accountData.waba_id,
      phone_number_id: accountData.phone_number_id,
      display_name: accountData.display_name,
      access_token: accountData.access_token,
      status: "active",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "tenant_id" }
  );

  if (error) {
    console.error("[whatsapp/connect] upsert failed:", error);
    return NextResponse.json({ error: "Failed to save connection" }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    message: "WhatsApp connected successfully",
    displayName: accountData.display_name,
  });
}

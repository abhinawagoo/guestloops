/**
 * WhatsApp Cloud API — send template message.
 * Supports both env-based (legacy) and tenant-scoped (whatsapp_accounts) credentials.
 */
const WHATSAPP_API_VERSION = "v22.0";

export type SendTemplateResult = { sent: true; messageId?: string } | { sent: false; error: string };

export type WhatsAppCredentials = {
  accessToken: string;
  phoneNumberId: string;
};

/**
 * Fetch tenant's WhatsApp credentials from whatsapp_accounts.
 * Returns null if not connected or table unavailable.
 */
export async function getWhatsAppCredentialsForTenant(
  tenantId: string
): Promise<WhatsAppCredentials | null> {
  try {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const admin = createAdminClient();
    if (!admin) return null;

    const { data } = await admin
      .from("whatsapp_accounts")
      .select("access_token, phone_number_id")
      .eq("tenant_id", tenantId)
      .eq("status", "active")
      .single();

    if (!data?.access_token || !data?.phone_number_id) return null;
    return {
      accessToken: data.access_token,
      phoneNumberId: data.phone_number_id,
    };
  } catch {
    return null;
  }
}

/**
 * Send template message using tenant's connected WhatsApp account.
 * Falls back to env vars if tenant has no connection (backward compat).
 */
export async function sendWhatsAppTemplateForTenant(
  tenantId: string,
  to: string,
  options: { templateName?: string; languageCode?: string; venueName?: string } = {}
): Promise<SendTemplateResult> {
  const creds = await getWhatsAppCredentialsForTenant(tenantId);
  const token = creds?.accessToken ?? process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = creds?.phoneNumberId ?? process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    const missing = [!token && "access token", !phoneNumberId && "phone number"].filter(Boolean).join(", ");
    return { sent: false, error: `WhatsApp not configured for this business (missing: ${missing})` };
  }

  return sendWhatsAppTemplateWithCreds(
    { accessToken: token, phoneNumberId },
    to,
    options
  );
}

async function sendWhatsAppTemplateWithCreds(
  creds: WhatsAppCredentials,
  to: string,
  options: { templateName?: string; languageCode?: string; venueName?: string } = {}
): Promise<SendTemplateResult> {
  const normalizedTo = to.replace(/\D/g, "").slice(-15);
  if (normalizedTo.length < 10) {
    return { sent: false, error: "Invalid mobile number" };
  }

  const template = options.templateName ?? process.env.WHATSAPP_TEMPLATE_NAME ?? "hello_world";
  const languageCode = options.languageCode ?? process.env.WHATSAPP_TEMPLATE_LANGUAGE ?? "en_US";

  const payload: {
    messaging_product: string;
    to: string;
    type: string;
    template: {
      name: string;
      language: { code: string };
      components?: { type: string; parameters: { type: string; text: string }[] }[];
    };
  } = {
    messaging_product: "whatsapp",
    to: normalizedTo,
    type: "template",
    template: {
      name: template,
      language: { code: languageCode },
    },
  };

  if (options.venueName && template !== "hello_world") {
    payload.template.components = [
      {
        type: "body",
        parameters: [{ type: "text", text: options.venueName }],
      },
    ];
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${creds.phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${creds.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    const data = (await res.json().catch(() => ({}))) as { messages?: { id: string }[]; error?: { message?: string } };

    if (!res.ok) {
      console.error("WhatsApp API error:", res.status, data);
      return { sent: false, error: data.error?.message ?? "WhatsApp send failed" };
    }

    return { sent: true, messageId: data.messages?.[0]?.id };
  } catch (e) {
    console.error("WhatsApp send error:", e);
    return { sent: false, error: "Network error" };
  }
}

/**
 * Send template message using env vars (legacy single-tenant).
 * Prefer sendWhatsAppTemplateForTenant for multi-tenant.
 */
export async function sendWhatsAppTemplate(
  to: string,
  options: { templateName?: string; languageCode?: string; venueName?: string } = {}
): Promise<SendTemplateResult> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    const missing = [!token && "WHATSAPP_ACCESS_TOKEN", !phoneNumberId && "WHATSAPP_PHONE_NUMBER_ID"]
      .filter(Boolean)
      .join(", ");
    console.warn("[whatsapp] Not configured — missing:", missing || "env vars");
    return { sent: false, error: "WhatsApp not configured" };
  }

  return sendWhatsAppTemplateWithCreds(
    { accessToken: token, phoneNumberId },
    to,
    options
  );
}

/** Send to WHATSAPP_TEST_TO if set (for testing: every feedback completion). */
export async function sendTestNotificationIfConfigured(venueName?: string): Promise<void> {
  const testTo = process.env.WHATSAPP_TEST_TO;
  if (!testTo?.trim()) return;

  await sendWhatsAppTemplate(testTo.trim(), {
    templateName: "hello_world",
    languageCode: "en_US",
    venueName,
  });
}

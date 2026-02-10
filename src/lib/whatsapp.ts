/**
 * WhatsApp Cloud API — send template message.
 * Used by send-whatsapp route and by feedback submit (test number when WHATSAPP_TEST_TO is set).
 */
const WHATSAPP_API_VERSION = "v22.0";

export type SendTemplateResult = { sent: true; messageId?: string } | { sent: false; error: string };

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
      `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
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

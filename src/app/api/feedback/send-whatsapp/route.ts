import { NextResponse } from "next/server";

/**
 * Sends an automated WhatsApp message via Cloud API using an approved template.
 * Called after feedback submission when customer has opted in.
 * Requires: WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID.
 * Template must be approved in Meta Business Suite (e.g. hello_world or custom feedback_thank_you).
 */
const WHATSAPP_API_VERSION = "v18.0";

export async function POST(request: Request) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    return NextResponse.json(
      { sent: false, error: "WhatsApp not configured" },
      { status: 503 }
    );
  }

  let body: { venueId: string; mobile: string; venueName?: string; templateName?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ sent: false, error: "Invalid JSON" }, { status: 400 });
  }

  const { venueId, mobile, venueName, templateName } = body;
  if (!venueId || !mobile) {
    return NextResponse.json(
      { sent: false, error: "venueId and mobile required" },
      { status: 400 }
    );
  }

  const to = mobile.replace(/\D/g, "").slice(-15);
  if (to.length < 10) {
    return NextResponse.json(
      { sent: false, error: "Invalid mobile number" },
      { status: 400 }
    );
  }

  const template = templateName || process.env.WHATSAPP_TEMPLATE_NAME || "hello_world";
  const languageCode = process.env.WHATSAPP_TEMPLATE_LANGUAGE || "en";

  let payload: {
    messaging_product: string;
    recipient_type: string;
    to: string;
    type: string;
    template: {
      name: string;
      language: { code: string };
      components?: { type: string; parameters: { type: string; text: string }[] }[];
    };
  } = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "template",
    template: {
      name: template,
      language: { code: languageCode },
    },
  };

  if (venueName && template !== "hello_world") {
    payload.template.components = [
      {
        type: "body",
        parameters: [{ type: "text", text: venueName }],
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

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      console.error("WhatsApp API error:", res.status, data);
      return NextResponse.json(
        { sent: false, error: data.error?.message || "WhatsApp send failed" },
        { status: res.status >= 500 ? 502 : 400 }
      );
    }

    return NextResponse.json({
      sent: true,
      messageId: data.messages?.[0]?.id,
    });
  } catch (e) {
    console.error("WhatsApp send error:", e);
    return NextResponse.json(
      { sent: false, error: "Network error" },
      { status: 502 }
    );
  }
}

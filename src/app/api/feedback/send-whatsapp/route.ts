import { NextResponse } from "next/server";
import { sendWhatsAppTemplate } from "@/lib/whatsapp";

/**
 * Sends an automated WhatsApp message via Cloud API using an approved template.
 * Called after feedback submission when customer has opted in.
 * Requires: WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID.
 * Template must be approved in Meta Business Suite (e.g. hello_world or custom feedback_thank_you).
 */
export async function POST(request: Request) {
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

  const result = await sendWhatsAppTemplate(mobile, {
    templateName,
    languageCode: process.env.WHATSAPP_TEMPLATE_LANGUAGE || "en_US",
    venueName,
  });

  if (!result.sent) {
    const status = result.error === "WhatsApp not configured" ? 503 : 502;
    return NextResponse.json({ sent: false, error: result.error }, { status });
  }

  return NextResponse.json({
    sent: true,
    messageId: result.messageId,
  });
}

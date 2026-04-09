import { NextResponse } from "next/server";
import { requireAdminTenant } from "@/lib/require-admin-tenant";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendWhatsAppTemplateMessage, type SendMessageComponent } from "@/lib/meta-whatsapp";

export const dynamic = "force-dynamic";

type SendBody = {
  templateName: string;
  languageCode: string;
  to: string | string[];         // single phone or array for broadcast
  components?: SendMessageComponent[];
};

/**
 * POST /api/admin/whatsapp/send
 * Send an approved template to one or more contacts.
 * Body: { templateName, languageCode, to, components? }
 */
export async function POST(request: Request) {
  const ctx = await requireAdminTenant();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "DB unavailable" }, { status: 500 });

  const body = (await request.json().catch(() => null)) as SendBody | null;
  if (!body?.templateName || !body.to) {
    return NextResponse.json({ error: "templateName and to are required" }, { status: 400 });
  }

  // Get WhatsApp credentials
  const { data: wa } = await admin
    .from("whatsapp_accounts")
    .select("phone_number_id, access_token")
    .eq("tenant_id", ctx.tenantId)
    .eq("status", "active")
    .single();

  if (!wa?.phone_number_id || !wa?.access_token) {
    return NextResponse.json({ error: "WhatsApp account not connected" }, { status: 400 });
  }

  const recipients = Array.isArray(body.to) ? body.to : [body.to];
  const results: { to: string; sent: boolean; messageId?: string; error?: string }[] = [];

  for (const phone of recipients) {
    try {
      const { messageId } = await sendWhatsAppTemplateMessage(
        wa.phone_number_id,
        wa.access_token,
        phone,
        body.templateName,
        body.languageCode ?? "en_US",
        body.components
      );
      results.push({ to: phone, sent: true, messageId });

      // Update last_interaction for this contact
      await admin
        .from("contacts")
        .update({ last_interaction: new Date().toISOString() })
        .eq("tenant_id", ctx.tenantId)
        .like("phone", `%${phone.replace(/\D/g, "").slice(-10)}`);
    } catch (e) {
      results.push({ to: phone, sent: false, error: (e as Error).message });
    }
  }

  const sentCount = results.filter((r) => r.sent).length;
  const failCount = results.length - sentCount;

  return NextResponse.json({ results, sentCount, failCount });
}

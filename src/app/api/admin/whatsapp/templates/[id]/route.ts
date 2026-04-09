import { NextResponse } from "next/server";
import { requireAdminTenant } from "@/lib/require-admin-tenant";
import { createAdminClient } from "@/lib/supabase/admin";
import { deleteWhatsAppTemplate } from "@/lib/meta-whatsapp";

export const dynamic = "force-dynamic";

/**
 * DELETE /api/admin/whatsapp/templates/[id]
 * Deletes the template from Meta (by name) and removes from DB.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await requireAdminTenant();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "DB unavailable" }, { status: 500 });

  const { id } = await params;

  // Fetch the template to get name + verify ownership
  const { data: template } = await admin
    .from("whatsapp_templates")
    .select("id, name, tenant_id")
    .eq("id", id)
    .eq("tenant_id", ctx.tenantId)
    .single();

  if (!template) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  // Get WhatsApp credentials
  const { data: wa } = await admin
    .from("whatsapp_accounts")
    .select("waba_id, access_token")
    .eq("tenant_id", ctx.tenantId)
    .eq("status", "active")
    .single();

  // Attempt Meta deletion (non-fatal if it fails — template may already be gone)
  if (wa?.waba_id && wa?.access_token) {
    try {
      await deleteWhatsAppTemplate(wa.waba_id, wa.access_token, template.name);
    } catch (e) {
      console.warn("[whatsapp/templates/delete] Meta delete error (continuing):", (e as Error).message);
    }
  }

  // Remove from DB regardless
  await admin.from("whatsapp_templates").delete().eq("id", id).eq("tenant_id", ctx.tenantId);

  return NextResponse.json({ success: true });
}

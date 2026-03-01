import { NextResponse } from "next/server";
import { requireAdminTenant } from "@/lib/require-admin-tenant";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/whatsapp/disconnect
 * Disconnect tenant's WhatsApp account.
 */
export async function POST() {
  const ctx = await requireAdminTenant();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "Database unavailable" }, { status: 500 });

  const { error } = await admin
    .from("whatsapp_accounts")
    .delete()
    .eq("tenant_id", ctx.tenantId);

  if (error) {
    console.error("[whatsapp/disconnect] delete failed:", error);
    return NextResponse.json({ error: "Failed to disconnect" }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: "WhatsApp disconnected" });
}

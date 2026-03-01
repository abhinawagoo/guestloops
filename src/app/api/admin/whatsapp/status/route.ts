import { NextResponse } from "next/server";
import { requireAdminTenant } from "@/lib/require-admin-tenant";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/whatsapp/status
 * Returns WhatsApp connection status for the tenant.
 */
export async function GET() {
  const ctx = await requireAdminTenant();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ connected: false, account: null });

  const { data: account } = await admin
    .from("whatsapp_accounts")
    .select("id, waba_id, phone_number_id, display_name, status, created_at")
    .eq("tenant_id", ctx.tenantId)
    .single();

  return NextResponse.json({
    connected: !!account && account.status === "active",
    account: account
      ? {
          id: account.id,
          displayName: account.display_name,
          status: account.status,
          connectedAt: account.created_at,
        }
      : null,
  });
}

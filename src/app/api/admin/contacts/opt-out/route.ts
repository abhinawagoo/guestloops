import { NextResponse } from "next/server";
import { requireAdminTenant } from "@/lib/require-admin-tenant";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "").slice(-15);
}

/**
 * POST /api/admin/contacts/opt-out
 * Mark contact as opted out by phone. Body: { phone }
 * Used for manual opt-out or webhook (Module 8).
 */
export async function POST(request: Request) {
  const ctx = await requireAdminTenant();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  let body: { phone: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const phone = normalizePhone(body.phone ?? "");
  if (phone.length < 10) {
    return NextResponse.json({ error: "Valid phone number required" }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "Database unavailable" }, { status: 500 });

  const { data, error } = await admin
    .from("contacts")
    .update({
      consent_status: "opted_out",
      last_interaction: new Date().toISOString(),
    })
    .eq("tenant_id", ctx.tenantId)
    .eq("phone", phone)
    .select("id, name, phone, consent_status")
    .maybeSingle();

  if (error) {
    console.error("[admin/contacts] opt-out:", error);
    return NextResponse.json({ error: "Failed to update opt-out" }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    contact: data ?? null,
    message: data ? "Contact opted out" : "No contact found with this phone",
  });
}

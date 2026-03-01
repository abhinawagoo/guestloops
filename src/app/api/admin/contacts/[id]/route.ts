import { NextResponse } from "next/server";
import { requireAdminTenant } from "@/lib/require-admin-tenant";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "").slice(-15);
}

/**
 * PATCH /api/admin/contacts/[id]
 * Update contact. Body: { name?, phone?, consent_status? }
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await requireAdminTenant();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { id } = await params;

  let body: { name?: string; phone?: string; consent_status?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "Database unavailable" }, { status: 500 });

  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) updates.name = body.name.trim() || null;
  if (body.phone !== undefined) {
    const phone = normalizePhone(body.phone);
    if (phone.length < 10) {
      return NextResponse.json({ error: "Valid phone number required" }, { status: 400 });
    }
    updates.phone = phone;
  }
  if (body.consent_status && ["pending", "opted_in", "opted_out"].includes(body.consent_status)) {
    updates.consent_status = body.consent_status;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No updates provided" }, { status: 400 });
  }

  const { data, error } = await admin
    .from("contacts")
    .update(updates)
    .eq("id", id)
    .eq("tenant_id", ctx.tenantId)
    .select("id, name, phone, consent_status, consent_source, created_at, last_interaction")
    .single();

  if (error) {
    if (error.code === "23505") return NextResponse.json({ error: "Phone already in use" }, { status: 409 });
    console.error("[admin/contacts] update:", error);
    return NextResponse.json({ error: "Failed to update contact" }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Contact not found" }, { status: 404 });
  }

  return NextResponse.json({ contact: data });
}

/**
 * DELETE /api/admin/contacts/[id]
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await requireAdminTenant();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { id } = await params;
  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "Database unavailable" }, { status: 500 });

  const { error } = await admin
    .from("contacts")
    .delete()
    .eq("id", id)
    .eq("tenant_id", ctx.tenantId);

  if (error) {
    console.error("[admin/contacts] delete:", error);
    return NextResponse.json({ error: "Failed to delete contact" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

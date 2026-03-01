import { NextResponse } from "next/server";
import { requireAdminTenant } from "@/lib/require-admin-tenant";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "").slice(-15);
}

/**
 * GET /api/admin/contacts
 * List contacts for the tenant. Query params: consent_status, search, limit, offset
 */
export async function GET(request: Request) {
  const ctx = await requireAdminTenant();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const consentStatus = searchParams.get("consent_status");
  const search = searchParams.get("search")?.trim();
  const limit = Math.min(Number(searchParams.get("limit")) || 50, 100);
  const offset = Math.max(0, Number(searchParams.get("offset")) || 0);

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "Database unavailable" }, { status: 500 });

  let query = admin
    .from("contacts")
    .select("id, name, phone, consent_status, consent_source, created_at, last_interaction", { count: "exact" })
    .eq("tenant_id", ctx.tenantId)
    .order("last_interaction", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (consentStatus && ["pending", "opted_in", "opted_out"].includes(consentStatus)) {
    query = query.eq("consent_status", consentStatus);
  }

  if (search) {
    const safe = search.replace(/[%_\\]/g, "");
    if (safe.length > 0) {
      const term = `%${safe}%`;
      query = query.or(`name.ilike."${term}",phone.ilike."${term}"`);
    }
  }

  const { data: rows, error, count } = await query;

  if (error) {
    console.error("[admin/contacts] list:", error);
    return NextResponse.json({ error: "Failed to load contacts" }, { status: 500 });
  }

  return NextResponse.json({
    contacts: rows ?? [],
    total: count ?? 0,
  });
}

/**
 * POST /api/admin/contacts
 * Add contact manually. Body: { name?, phone, consent_status?, consent_source? }
 */
export async function POST(request: Request) {
  const ctx = await requireAdminTenant();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  let body: { name?: string; phone: string; consent_status?: string; consent_source?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const phone = normalizePhone(body.phone ?? "");
  if (phone.length < 10) {
    return NextResponse.json({ error: "Valid phone number required" }, { status: 400 });
  }

  const consentStatus = body.consent_status && ["pending", "opted_in", "opted_out"].includes(body.consent_status)
    ? body.consent_status
    : "pending";
  const consentSource = body.consent_source === "manual" ? "manual" : null;

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "Database unavailable" }, { status: 500 });

  const { data, error } = await admin
    .from("contacts")
    .upsert(
      {
        tenant_id: ctx.tenantId,
        name: body.name?.trim() || null,
        phone,
        consent_status: consentStatus,
        consent_source: consentSource,
        last_interaction: new Date().toISOString(),
      },
      { onConflict: "tenant_id,phone", ignoreDuplicates: false }
    )
    .select("id, name, phone, consent_status, consent_source, created_at, last_interaction")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Contact with this phone already exists" }, { status: 409 });
    }
    console.error("[admin/contacts] insert:", error);
    return NextResponse.json({ error: "Failed to add contact" }, { status: 500 });
  }

  return NextResponse.json({ contact: data });
}

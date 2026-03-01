import { NextResponse } from "next/server";
import { requireAdminTenant } from "@/lib/require-admin-tenant";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "").slice(-15);
}

/**
 * POST /api/admin/contacts/import
 * Import contacts from CSV. Body: { csv: string } or multipart file.
 * CSV format: name,phone (header optional). Phone can be with/without country code.
 */
export async function POST(request: Request) {
  const ctx = await requireAdminTenant();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  let csvText: string;

  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const body = await request.json().catch(() => ({}));
    csvText = body.csv ?? body.data ?? "";
  } else if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    csvText = await file.text();
  } else {
    return NextResponse.json(
      { error: "Provide JSON { csv: string } or multipart file" },
      { status: 400 }
    );
  }

  if (!csvText?.trim()) {
    return NextResponse.json({ error: "Empty CSV" }, { status: 400 });
  }

  const lines = csvText.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) {
    return NextResponse.json({ error: "No rows in CSV" }, { status: 400 });
  }

  const rows: { name: string; phone: string }[] = [];
  const header = lines[0].toLowerCase();
  const hasHeader = header.includes("name") && header.includes("phone");
  const start = hasHeader ? 1 : 0;

  for (let i = start; i < lines.length; i++) {
    const line = lines[i];
    const parts = line.split(",").map((p) => p.trim().replace(/^["']|["']$/g, ""));
    const phone = normalizePhone(parts.length >= 2 ? parts[1] : parts[0]);
    const name = parts.length >= 2 ? parts[0] : "";
    if (phone.length >= 10) {
      rows.push({ name: name || "Imported", phone });
    }
  }

  if (rows.length === 0) {
    return NextResponse.json({ error: "No valid contacts (need phone with 10+ digits)" }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "Database unavailable" }, { status: 500 });

  const now = new Date().toISOString();
  const toInsert = rows.map((r) => ({
    tenant_id: ctx.tenantId,
    name: r.name || null,
    phone: r.phone,
    consent_status: "pending",
    consent_source: "csv_import",
    last_interaction: now,
  }));

  const { data, error } = await admin
    .from("contacts")
    .upsert(toInsert, { onConflict: "tenant_id,phone", ignoreDuplicates: false })
    .select("id");

  if (error) {
    console.error("[admin/contacts] import:", error);
    return NextResponse.json({ error: "Failed to import contacts" }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    imported: data?.length ?? rows.length,
    total: rows.length,
  });
}

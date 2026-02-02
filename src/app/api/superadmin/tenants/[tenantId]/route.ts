import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { getTenantFromHeaders } from "@/lib/tenant";
import { updateTenant } from "@/data/tenants";
import type { PlanSlug, TenantStatus } from "@/types/tenant";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const headersList = await headers();
  const ctx = getTenantFromHeaders(headersList);

  if (ctx.hostType !== "superadmin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { tenantId } = await params;
  if (!tenantId) {
    return NextResponse.json({ error: "tenantId required" }, { status: 400 });
  }

  let body: { plan?: PlanSlug; status?: TenantStatus };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const updated = updateTenant(tenantId, {
    plan: body.plan,
    status: body.status,
  });

  if (!updated) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}

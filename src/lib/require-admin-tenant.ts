/**
 * Best practice: one place to resolve and validate admin tenant context.
 * Use in admin API routes and server components to ensure the authenticated
 * user belongs to the requested tenant (no cross-tenant access).
 */

import { headers } from "next/headers";
import { getTenantFromHeaders } from "@/lib/tenant";
import { getTenantByIdAsync, getTenantBySlugAsync } from "@/lib/tenant-resolver";
import { createClient } from "@/lib/supabase/server";
import type { Tenant } from "@/types/tenant";
import type { User } from "@supabase/supabase-js";

export type AdminTenantResult = {
  tenant: Tenant;
  user: User;
  tenantId: string;
  tenantSlug: string;
};

/**
 * Resolve tenant from request and validate that the authenticated user
 * belongs to that tenant. Returns null if unauthenticated or not tenant context;
 * use in API routes and return 403 when null.
 */
export async function requireAdminTenant(): Promise<AdminTenantResult | null> {
  const headersList = await headers();
  const ctx = getTenantFromHeaders(headersList);
  if (ctx.hostType !== "tenant") return null;

  const supabase = await createClient();
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  let tenant: Tenant | null = null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("tenant_id")
    .eq("id", user.id)
    .single();

  if (profile?.tenant_id) {
    tenant = await getTenantByIdAsync(profile.tenant_id);
  }
  if (!tenant && ctx.tenantId) {
    tenant = await getTenantByIdAsync(ctx.tenantId);
  }
  if (!tenant && ctx.tenantSlug) {
    tenant = await getTenantBySlugAsync(ctx.tenantSlug);
  }

  if (!tenant) return null;
  if (profile?.tenant_id && profile.tenant_id !== tenant.id) return null;

  return {
    tenant,
    user,
    tenantId: tenant.id,
    tenantSlug: tenant.slug,
  };
}

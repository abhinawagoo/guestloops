/**
 * Resolve tenant and host type from request (subdomain or dev headers).
 * Production: demo.growthapp.com → tenant "demo"; admin.growthapp.com → superadmin; app.growthapp.com → app.
 * Development: use ?tenant=slug or ?host=superadmin or header X-Tenant-Slug.
 */

export type HostType = "tenant" | "app" | "superadmin";

const SUPERADMIN_SUBDOMAINS = ["admin", "superadmin"];
const APP_SUBDOMAINS = ["app", "www", ""];

export interface TenantContext {
  hostType: HostType;
  tenantSlug: string | null;
  tenantId: string | null;
}

/**
 * Parse hostname to get subdomain. Assumes format: subdomain.domain.com or domain.com.
 */
function getSubdomain(hostname: string, rootDomain?: string): string {
  const parts = hostname.split(".");
  if (rootDomain) {
    const rootParts = rootDomain.split(".");
    if (parts.length > rootParts.length) {
      return parts.slice(0, parts.length - rootParts.length).join(".");
    }
    return "";
  }
  // localhost or single word
  if (parts.length <= 1) return "";
  // e.g. demo.growthapp.com → demo; growthapp.com → ""
  if (parts.length === 2) return ""; // e.g. growthapp.com
  return parts[0];
}

/**
 * Resolve tenant context from request. Use in middleware and API routes.
 */
export function getTenantContext(
  hostname: string,
  searchParams?: URLSearchParams,
  headerTenantSlug?: string | null,
  headerHost?: string | null
): TenantContext {
  // Dev override: ?tenant=demo or ?host=superadmin
  const qTenant = searchParams?.get("tenant");
  const qHost = searchParams?.get("host");
  if (headerHost === "superadmin" || qHost === "superadmin") {
    return { hostType: "superadmin", tenantSlug: null, tenantId: null };
  }
  if (headerTenantSlug || qTenant) {
    const slug = (headerTenantSlug ?? qTenant)!.toLowerCase().trim();
    return { hostType: "tenant", tenantSlug: slug, tenantId: null };
  }

  const subdomain = getSubdomain(hostname).toLowerCase();
  if (SUPERADMIN_SUBDOMAINS.includes(subdomain)) {
    return { hostType: "superadmin", tenantSlug: null, tenantId: null };
  }
  if (APP_SUBDOMAINS.includes(subdomain) || subdomain === "") {
    return { hostType: "app", tenantSlug: null, tenantId: null };
  }
  return { hostType: "tenant", tenantSlug: subdomain, tenantId: null };
}

/** Header names we set in middleware for downstream use */
export const TENANT_HEADERS = {
  HOST_TYPE: "x-host-type",
  TENANT_SLUG: "x-tenant-slug",
  TENANT_ID: "x-tenant-id",
} as const;

/**
 * Read tenant context from request headers (set by middleware).
 * Use in Server Components and Route Handlers via headers().
 */
export function getTenantFromHeaders(headers: Headers): TenantContext {
  const hostType = (headers.get(TENANT_HEADERS.HOST_TYPE) ?? "app") as HostType;
  const tenantSlug = headers.get(TENANT_HEADERS.TENANT_SLUG);
  const tenantId = headers.get(TENANT_HEADERS.TENANT_ID);
  return {
    hostType,
    tenantSlug: tenantSlug || null,
    tenantId: tenantId || null,
  };
}

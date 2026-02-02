import type { Tenant, TenantStatus, PlanSlug } from "@/types/tenant";
import type { Venue } from "@/types/venue";
import { getSettings } from "@/data/venue-settings";

const tenantsById = new Map<string, Tenant>();
const tenantIdBySlug = new Map<string, string>();
const venuesByTenant = new Map<string, Venue[]>();

/** Seed demo tenants and venues for development. */
function seed() {
  const t1: Tenant = {
    id: "tenant-demo",
    slug: "demo",
    name: "Demo Hospitality Group",
    businessType: "both",
    plan: "pro",
    status: "active",
    ownerEmail: "owner@demo.com",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  tenantsById.set(t1.id, t1);
  tenantIdBySlug.set(t1.slug, t1.id);

  const v1: Venue = {
    id: "demo-restaurant",
    tenantId: t1.id,
    name: "The Garden Table",
    type: "restaurant",
    rewardCta: "Win 10% off your next visit 🎁",
  };
  const v2: Venue = {
    id: "demo-hotel",
    tenantId: t1.id,
    name: "Riverside Boutique Hotel",
    type: "hotel",
    rewardCta: "Earn 500 loyalty points 🎁",
  };
  venuesByTenant.set(t1.id, [v1, v2]);

  // Second tenant (restaurant only)
  const t2: Tenant = {
    id: "tenant-bistro",
    slug: "bistro",
    name: "Bistro Central",
    businessType: "restaurant",
    plan: "starter",
    status: "active",
    ownerEmail: "hello@bistrocentral.com",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  tenantsById.set(t2.id, t2);
  tenantIdBySlug.set(t2.slug, t2.id);
  const v3: Venue = {
    id: "bistro-main",
    tenantId: t2.id,
    name: "Bistro Central",
    type: "restaurant",
  };
  venuesByTenant.set(t2.id, [v3]);
}

seed();

/** Get tenant by ID */
export function getTenantById(tenantId: string): Tenant | null {
  return tenantsById.get(tenantId) ?? null;
}

/** Get tenant by subdomain slug (e.g. "demo" from demo.growthapp.com) */
export function getTenantBySlug(slug: string): Tenant | null {
  const id = tenantIdBySlug.get(slug);
  return id ? tenantsById.get(id) ?? null : null;
}

/** List all tenants (super admin) */
export function getAllTenants(): Tenant[] {
  return Array.from(tenantsById.values()).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

/** Get all venues for a tenant */
export function getVenuesByTenantId(tenantId: string): Venue[] {
  return venuesByTenant.get(tenantId) ?? [];
}

/** Get a single venue by ID; returns null if venue not found or not owned by tenant */
export function getVenueForTenant(tenantId: string, venueId: string): Venue | null {
  const list = venuesByTenant.get(tenantId) ?? [];
  return list.find((v) => v.id === venueId) ?? null;
}

/** Get any venue by ID (for public QR flow; venueId is globally unique) */
export function getVenueById(venueId: string): Venue | null {
  for (const venues of venuesByTenant.values()) {
    const v = venues.find((x) => x.id === venueId);
    if (v) return v;
  }
  return null;
}

/** Create a new tenant (signup). Returns tenant or null if slug taken. */
export function createTenant(params: {
  slug: string;
  name: string;
  businessType: Tenant["businessType"];
  ownerEmail: string;
  ownerFirstName?: string;
  ownerLastName?: string;
  ownerMobile?: string;
  ownerCountryCode?: string;
  countryCode?: string;
  plan?: PlanSlug;
}): Tenant | null {
  if (getTenantBySlug(params.slug)) return null;
  const now = new Date().toISOString();
  const tenant: Tenant = {
    id: "tenant-" + Date.now(),
    slug: params.slug,
    name: params.name,
    businessType: params.businessType,
    plan: params.plan ?? "free",
    status: "trial",
    ownerEmail: params.ownerEmail,
    ownerFirstName: params.ownerFirstName,
    ownerLastName: params.ownerLastName,
    ownerMobile: params.ownerMobile,
    ownerCountryCode: params.ownerCountryCode,
    countryCode: params.countryCode,
    createdAt: now,
    updatedAt: now,
  };
  tenantsById.set(tenant.id, tenant);
  tenantIdBySlug.set(tenant.slug, tenant.id);
  venuesByTenant.set(tenant.id, []);
  return tenant;
}

/** Create first venue for a new tenant */
export function createVenueForTenant(
  tenantId: string,
  params: { name: string; type: Venue["type"] }
): Venue | null {
  const tenant = getTenantById(tenantId);
  if (!tenant) return null;
  const list = venuesByTenant.get(tenantId) ?? [];
  const venue: Venue = {
    id: "venue-" + Date.now(),
    tenantId,
    name: params.name,
    type: params.type,
  };
  list.push(venue);
  venuesByTenant.set(tenantId, list);
  // Ensure default settings exist for this venue
  getSettings(venue.id);
  return venue;
}

/** Update tenant (super admin: plan, status) */
export function updateTenant(
  tenantId: string,
  patch: Partial<Pick<Tenant, "plan" | "status" | "name" | "updatedAt">>
): Tenant | null {
  const tenant = getTenantById(tenantId);
  if (!tenant) return null;
  const updated: Tenant = {
    ...tenant,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  tenantsById.set(tenant.id, updated);
  tenantIdBySlug.set(tenant.slug, updated.id);
  return updated;
}

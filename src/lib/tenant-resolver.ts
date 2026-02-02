import { createClient } from "@supabase/supabase-js";
import type { Tenant } from "@/types/tenant";
import type { Venue } from "@/types/venue";
import { getTenantBySlug, getTenantById, getVenuesByTenantId } from "@/data/tenants";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

function mapTenantRow(row: Record<string, unknown>): Tenant {
  return {
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    businessType: (row.business_type as Tenant["businessType"]) ?? "restaurant",
    plan: (row.plan as Tenant["plan"]) ?? "free",
    status: (row.status as Tenant["status"]) ?? "trial",
    ownerEmail: String(row.owner_email),
    ownerFirstName: row.owner_first_name != null ? String(row.owner_first_name) : undefined,
    ownerLastName: row.owner_last_name != null ? String(row.owner_last_name) : undefined,
    ownerMobile: row.owner_mobile != null ? String(row.owner_mobile) : undefined,
    ownerCountryCode: row.owner_country_code != null ? String(row.owner_country_code) : undefined,
    countryCode: row.country_code != null ? String(row.country_code) : undefined,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function mapVenueRow(row: Record<string, unknown>, tenantId: string): Venue {
  return {
    id: String(row.id),
    tenantId,
    name: String(row.name),
    type: (row.type as Venue["type"]) ?? "restaurant",
    googlePlaceId: row.google_place_id != null ? String(row.google_place_id) : undefined,
    rewardCta: row.reward_cta != null ? String(row.reward_cta) : undefined,
  };
}

/** Resolve tenant by slug (in-memory first, then Supabase). Used in middleware and layout. */
export async function getTenantBySlugAsync(slug: string): Promise<Tenant | null> {
  const fromMemory = getTenantBySlug(slug);
  if (fromMemory) return fromMemory;
  if (!supabaseUrl || !supabaseAnonKey) return null;
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data, error } = await supabase
    .from("tenants")
    .select("*")
    .eq("slug", slug)
    .single();
  if (error || !data) return null;
  return mapTenantRow(data as Record<string, unknown>);
}

/** Resolve tenant by id (in-memory first, then Supabase). */
export async function getTenantByIdAsync(tenantId: string): Promise<Tenant | null> {
  const fromMemory = getTenantById(tenantId);
  if (fromMemory) return fromMemory;
  if (!supabaseUrl || !supabaseAnonKey) return null;
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data, error } = await supabase
    .from("tenants")
    .select("*")
    .eq("id", tenantId)
    .single();
  if (error || !data) return null;
  return mapTenantRow(data as Record<string, unknown>);
}

/** Resolve venues for tenant (in-memory first, then Supabase). Pass server Supabase client for RLS (user session). */
export async function getVenuesByTenantIdAsync(
  tenantId: string,
  supabaseClient?: Awaited<ReturnType<typeof import("@/lib/supabase/server").createClient>>
): Promise<Venue[]> {
  const fromMemory = getVenuesByTenantId(tenantId);
  if (fromMemory.length > 0) return fromMemory;
  if (supabaseClient) {
    const { data, error } = await supabaseClient
      .from("venues")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at");
    if (!error && data) {
      return (data as Record<string, unknown>[]).map((row) =>
        mapVenueRow(row, tenantId)
      );
    }
  }
  if (!supabaseUrl || !supabaseAnonKey) return [];
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data, error } = await supabase
    .from("venues")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at");
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map((row) =>
    mapVenueRow(row, tenantId)
  );
}

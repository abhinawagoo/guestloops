/**
 * Multi-tenant types: tenants (hotels/restaurants), plans, and super-admin.
 * Each tenant gets a subdomain (e.g. acme.growthapp.com) and owns venues.
 */

export type PlanSlug = "free" | "starter" | "pro" | "enterprise";

export interface Plan {
  slug: PlanSlug;
  name: string;
  /** Max venues per tenant */
  maxVenues: number;
  /** Features list for display */
  features: string[];
}

export const PLANS: Record<PlanSlug, Plan> = {
  free: {
    slug: "free",
    name: "Free",
    maxVenues: 1,
    features: ["1 venue", "QR feedback flow", "AI review draft"],
  },
  starter: {
    slug: "starter",
    name: "Starter",
    maxVenues: 3,
    features: ["Up to 3 venues", "WhatsApp opt-in", "Custom questions"],
  },
  pro: {
    slug: "pro",
    name: "Pro",
    maxVenues: 10,
    features: ["Up to 10 venues", "AI insights", "Competitor benchmark"],
  },
  enterprise: {
    slug: "enterprise",
    name: "Enterprise",
    maxVenues: 999,
    features: ["Unlimited venues", "Dedicated support", "Custom integrations"],
  },
};

export type TenantStatus = "active" | "suspended" | "trial" | "cancelled";

export interface Tenant {
  id: string;
  /** Subdomain slug, e.g. "acme" → acme.growthapp.com */
  slug: string;
  name: string;
  /** Business type for display */
  businessType: "hotel" | "restaurant" | "both";
  plan: PlanSlug;
  status: TenantStatus;
  /** Owner email (first user) */
  ownerEmail: string;
  /** Owner contact (signup) */
  ownerFirstName?: string;
  ownerLastName?: string;
  /** E.164 with country code, e.g. +919876543210 */
  ownerMobile?: string;
  /** ISO 3166-1 alpha-2, e.g. IN, US */
  ownerCountryCode?: string;
  /** Business country (display) */
  countryCode?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TenantUser {
  id: string;
  tenantId: string;
  email: string;
  role: "owner" | "admin" | "member";
  createdAt: string;
}

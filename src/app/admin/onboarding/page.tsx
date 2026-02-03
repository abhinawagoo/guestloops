import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Venue } from "@/types/venue";
import { OnboardingClient } from "./onboarding-client";
import { getTenantFromHeaders } from "@/lib/tenant";
import { getVenuesByTenantIdAsync, getTenantBySlugAsync } from "@/lib/tenant-resolver";
import { createClient } from "@/lib/supabase/server";

export default async function AdminOnboardingPage() {
  const headersList = await headers();
  const ctx = getTenantFromHeaders(headersList);
  if (ctx.hostType !== "tenant") redirect("/");

  let tenantId = ctx.tenantId;
  if (!tenantId && ctx.tenantSlug) {
    const tenant = await getTenantBySlugAsync(ctx.tenantSlug);
    tenantId = tenant?.id ?? null;
  }
  if (!tenantId) redirect("/");

  const supabase = await createClient();
  const venueOptions: Venue[] = await getVenuesByTenantIdAsync(tenantId, supabase ?? undefined);

  return (
    <div className="space-y-10">
      <OnboardingClient initialVenues={venueOptions} />
    </div>
  );
}

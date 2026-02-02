import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Venue } from "@/types/venue";
import { SettingsPanel } from "./settings-panel";
import { getTenantFromHeaders } from "@/lib/tenant";
import { getVenuesByTenantIdAsync } from "@/lib/tenant-resolver";
import { createClient } from "@/lib/supabase/server";

export default async function AdminSettingsPage() {
  const headersList = await headers();
  const ctx = getTenantFromHeaders(headersList);
  if (ctx.hostType !== "tenant" || !ctx.tenantId) redirect("/");

  const supabase = await createClient();
  const venueOptions: Venue[] = await getVenuesByTenantIdAsync(ctx.tenantId, supabase ?? undefined);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1.5 max-w-xl">
          Customize what guests see and which questions they answer
        </p>
      </div>
      <SettingsPanel venueOptions={venueOptions} />
    </div>
  );
}

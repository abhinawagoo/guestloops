import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Venue } from "@/types/venue";
import { getTenantFromHeaders } from "@/lib/tenant";
import { getVenuesByTenantIdAsync } from "@/lib/tenant-resolver";
import { createClient } from "@/lib/supabase/server";
import { ReviewsPanel } from "./reviews-panel";

export default async function AdminReviewsPage() {
  const headersList = await headers();
  const ctx = getTenantFromHeaders(headersList);
  if (ctx.hostType !== "tenant" || !ctx.tenantId) redirect("/");

  const supabase = await createClient();
  const venueOptions: Venue[] = await getVenuesByTenantIdAsync(ctx.tenantId, supabase ?? undefined);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Reviews</h1>
        <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">
          View feedback submissions, generate AI replies with your chosen tone, and copy to post on Google.
        </p>
      </div>
      <ReviewsPanel venueOptions={venueOptions} />
    </div>
  );
}

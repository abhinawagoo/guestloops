import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getTenantById,
  getVenuesByTenantId,
  updateTenant,
} from "@/data/tenants";
import { PLANS, type PlanSlug, type TenantStatus } from "@/types/tenant";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TenantManageForm } from "./tenant-manage-form";

export default async function SuperAdminTenantDetailPage({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = await params;
  const tenant = getTenantById(tenantId);
  if (!tenant) notFound();

  const venues = getVenuesByTenantId(tenantId);
  const plan = PLANS[tenant.plan];

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="sm" className="text-slate-400 hover:text-white">
          <Link href="/superadmin/tenants">← Tenants</Link>
        </Button>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            {tenant.name}
          </h1>
          <p className="mt-1 text-slate-400">
            {tenant.slug}.yourdomain.com · {tenant.businessType}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant="secondary" className="rounded bg-slate-700 text-slate-300">
              {plan.name}
            </Badge>
            <span
              className={
                tenant.status === "active" || tenant.status === "trial"
                  ? "text-emerald-400"
                  : "text-slate-500"
              }
            >
              {tenant.status}
            </span>
          </div>
        </div>
      </div>

      <TenantManageForm
        tenantId={tenant.id}
        currentPlan={tenant.plan}
        currentStatus={tenant.status}
      />

      <Card className="border-slate-800 bg-slate-900/50">
        <CardHeader>
          <CardTitle className="text-lg text-white">Venues ({venues.length})</CardTitle>
          <p className="text-sm text-slate-500">
            Limit: {plan.maxVenues} for {plan.name} plan
          </p>
        </CardHeader>
        <CardContent>
          {venues.length === 0 ? (
            <p className="text-sm text-slate-500">No venues yet.</p>
          ) : (
            <ul className="space-y-2">
              {venues.map((v) => (
                <li
                  key={v.id}
                  className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-800/50 px-4 py-2 text-sm"
                >
                  <span className="font-medium text-white">{v.name}</span>
                  <span className="text-slate-500">{v.type}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="border-slate-800 bg-slate-900/50">
        <CardHeader>
          <CardTitle className="text-lg text-white">Plan features</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-inside list-disc space-y-1 text-sm text-slate-400">
            {plan.features.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

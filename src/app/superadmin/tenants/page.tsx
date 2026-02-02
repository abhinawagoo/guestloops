import Link from "next/link";
import { getAllTenants } from "@/data/tenants";
import { getVenuesByTenantId } from "@/data/tenants";
import { PLANS } from "@/types/tenant";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function SuperAdminTenantsPage() {
  const tenants = getAllTenants();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          All tenants
        </h1>
        <p className="mt-1.5 text-sm text-slate-400">
          Hotels and restaurants using your platform. Manage plans and status.
        </p>
      </div>

      <Card className="border-slate-800 bg-slate-900/50">
        <CardHeader>
          <CardTitle className="text-lg text-white">Tenants</CardTitle>
        </CardHeader>
        <CardContent>
          {tenants.length === 0 ? (
            <p className="text-sm text-slate-500">No tenants yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500">
                    <th className="pb-3 pr-4 font-medium">Business</th>
                    <th className="pb-3 pr-4 font-medium">Subdomain</th>
                    <th className="pb-3 pr-4 font-medium">Plan</th>
                    <th className="pb-3 pr-4 font-medium">Status</th>
                    <th className="pb-3 pr-4 font-medium">Venues</th>
                    <th className="pb-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {tenants.map((t) => {
                    const venues = getVenuesByTenantId(t.id);
                    return (
                      <tr
                        key={t.id}
                        className="border-b border-slate-800/80 hover:bg-slate-800/30"
                      >
                        <td className="py-3 pr-4">
                          <p className="font-medium text-white">{t.name}</p>
                          <p className="text-xs text-slate-500">{t.ownerEmail}</p>
                        </td>
                        <td className="py-3 pr-4 font-mono text-slate-400">
                          {t.slug}
                        </td>
                        <td className="py-3 pr-4">
                          <Badge variant="secondary" className="rounded bg-slate-700 text-slate-300">
                            {PLANS[t.plan].name}
                          </Badge>
                        </td>
                        <td className="py-3 pr-4">
                          <span
                            className={
                              t.status === "active" || t.status === "trial"
                                ? "text-emerald-400"
                                : t.status === "suspended"
                                  ? "text-amber-400"
                                  : "text-slate-500"
                            }
                          >
                            {t.status}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-slate-400">
                          {venues.length}
                        </td>
                        <td className="py-3">
                          <Button asChild size="sm" variant="ghost" className="text-slate-400 hover:text-white">
                            <Link href={`/superadmin/tenants/${t.id}`}>
                              Manage
                            </Link>
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

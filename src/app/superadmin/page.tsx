import Link from "next/link";
import { getAllTenants } from "@/data/tenants";
import { PLANS } from "@/types/tenant";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function SuperAdminDashboard() {
  const tenants = getAllTenants();
  const activeCount = tenants.filter((t) => t.status === "active" || t.status === "trial").length;
  const planCounts = tenants.reduce(
    (acc, t) => {
      acc[t.plan] = (acc[t.plan] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Platform Dashboard
        </h1>
        <p className="mt-1.5 text-sm text-slate-400">
          Manage all hotels and restaurants using your service
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-slate-800 bg-slate-900/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Total tenants
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white">{tenants.length}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-800 bg-slate-900/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Active / Trial
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-emerald-400">{activeCount}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-800 bg-slate-900/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Pro plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white">
              {planCounts.pro ?? 0}
            </p>
          </CardContent>
        </Card>
        <Card className="border-slate-800 bg-slate-900/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Enterprise
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white">
              {planCounts.enterprise ?? 0}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-800 bg-slate-900/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg text-white">Recent tenants</CardTitle>
          <Button asChild size="sm" variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800">
            <Link href="/superadmin/tenants">View all</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {tenants.length === 0 ? (
            <p className="text-sm text-slate-500">No tenants yet.</p>
          ) : (
            <ul className="space-y-3">
              {tenants.slice(0, 5).map((t) => (
                <li
                  key={t.id}
                  className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-800/50 px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-white">{t.name}</p>
                    <p className="text-xs text-slate-500">
                      {t.slug}.yourdomain.com · {t.ownerEmail}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-slate-700 px-2 py-0.5 text-xs text-slate-300">
                      {PLANS[t.plan].name}
                    </span>
                    <span
                      className={
                        t.status === "active" || t.status === "trial"
                          ? "text-emerald-400"
                          : "text-slate-500"
                      }
                    >
                      {t.status}
                    </span>
                    <Button asChild size="sm" variant="ghost" className="text-slate-400 hover:text-white">
                      <Link href={`/superadmin/tenants/${t.id}`}>Manage</Link>
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

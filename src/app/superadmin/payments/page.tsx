import Link from "next/link";
import { getAllTenants } from "@/data/tenants";
import { PLANS, type PlanSlug } from "@/types/tenant";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function SuperAdminPaymentsPage() {
  const tenants = getAllTenants();
  const planCounts = tenants.reduce(
    (acc, t) => {
      acc[t.plan] = (acc[t.plan] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );
  const paidPlans: PlanSlug[] = ["starter", "pro", "enterprise"];
  const paidCount = tenants.filter((t) => paidPlans.includes(t.plan)).length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Payments & plans
        </h1>
        <p className="mt-1.5 text-sm text-slate-400">
          Signups, plans, and subscription status. Razorpay integration coming soon.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-slate-800 bg-slate-900/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Total signups
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white">{tenants.length}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-800 bg-slate-900/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Paid plans
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-emerald-400">{paidCount}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-800 bg-slate-900/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Free
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white">{planCounts.free ?? 0}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-800 bg-slate-900/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Pro / Enterprise
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white">
              {(planCounts.pro ?? 0) + (planCounts.enterprise ?? 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-800 bg-slate-900/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg text-white">Signups & plans</CardTitle>
          <Button asChild size="sm" variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800">
            <Link href="/superadmin/tenants">View tenants</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {tenants.length === 0 ? (
            <p className="text-sm text-slate-500">No signups yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-left text-slate-400">
                    <th className="pb-3 pr-4 font-medium">Business</th>
                    <th className="pb-3 pr-4 font-medium">Owner</th>
                    <th className="pb-3 pr-4 font-medium">Plan</th>
                    <th className="pb-3 pr-4 font-medium">Status</th>
                    <th className="pb-3 font-medium">Signed up</th>
                  </tr>
                </thead>
                <tbody>
                  {tenants.slice(0, 50).map((t) => (
                    <tr key={t.id} className="border-b border-slate-800/80">
                      <td className="py-3 pr-4">
                        <Link
                          href={`/superadmin/tenants/${t.id}`}
                          className="font-medium text-white hover:text-amber-400"
                        >
                          {t.name}
                        </Link>
                        <span className="block text-xs text-slate-500">{t.slug}</span>
                      </td>
                      <td className="py-3 pr-4 text-slate-300">{t.ownerEmail}</td>
                      <td className="py-3 pr-4">
                        <span className="rounded bg-slate-700 px-2 py-0.5 text-slate-300">
                          {PLANS[t.plan].name}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={
                            t.status === "active" || t.status === "trial"
                              ? "text-emerald-400"
                              : "text-slate-500"
                          }
                        >
                          {t.status}
                        </span>
                      </td>
                      <td className="py-3 text-slate-500">
                        {t.createdAt ? new Date(t.createdAt).toLocaleDateString() : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-slate-800 bg-slate-900/50">
        <CardHeader>
          <CardTitle className="text-lg text-white">Payment history</CardTitle>
          <p className="text-sm text-slate-400">
            Razorpay subscription and one-time payments will appear here once integrated.
          </p>
        </CardHeader>
        <CardContent>
          <p className="rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-6 text-center text-sm text-slate-500">
            No payment records yet. Connect Razorpay in your environment to start collecting subscriptions.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

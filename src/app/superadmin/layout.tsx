import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTenantFromHeaders } from "@/lib/tenant";

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const ctx = getTenantFromHeaders(headersList);

  if (ctx.hostType !== "superadmin") {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-10 border-b border-slate-800 bg-slate-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link
            href="/superadmin"
            className="text-lg font-semibold tracking-tight text-white"
          >
            Platform Admin
          </Link>
          <nav className="flex items-center gap-1 text-sm text-slate-400">
            <Link
              href="/superadmin"
              className="rounded-lg px-3.5 py-2 hover:bg-slate-800 hover:text-white transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/superadmin/tenants"
              className="rounded-lg px-3.5 py-2 hover:bg-slate-800 hover:text-white transition-colors"
            >
              Tenants
            </Link>
            <Link
              href="/superadmin/payments"
              className="rounded-lg px-3.5 py-2 hover:bg-slate-800 hover:text-white transition-colors"
            >
              Payments
            </Link>
            <span className="ml-2 rounded bg-amber-500/20 px-2 py-0.5 text-xs text-amber-400">
              Super Admin
            </span>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}

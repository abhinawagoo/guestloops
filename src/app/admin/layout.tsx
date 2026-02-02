import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getTenantFromHeaders } from "@/lib/tenant";
import { getTenantByIdAsync } from "@/lib/tenant-resolver";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const ctx = getTenantFromHeaders(headersList);

  if (ctx.hostType !== "tenant" || !ctx.tenantId) {
    redirect("/");
  }

  const tenant = await getTenantByIdAsync(ctx.tenantId);
  if (!tenant) redirect("/");

  return (
    <div className="admin min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border/80 bg-card/95 backdrop-blur-md shadow-[0_1px_0_0_oklch(1_0_0_/_0.5)]">
        <div className="flex items-center justify-between max-w-5xl mx-auto px-6 py-4">
          <Link
            href="/admin"
            className="font-semibold text-lg tracking-tight text-foreground hover:text-primary transition-colors"
          >
            {tenant.name}
          </Link>
          <nav className="flex items-center gap-0.5 text-sm">
            <Link
              href="/admin"
              className="rounded-lg px-3.5 py-2 text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/admin/settings"
              className="rounded-lg px-3.5 py-2 text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors"
            >
              Settings
            </Link>
            <Link
              href="/admin/benchmark"
              className="rounded-lg px-3.5 py-2 text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors"
            >
              Competitors
            </Link>
            <Link
              href="/admin/reviews"
              className="rounded-lg px-3.5 py-2 text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors"
            >
              Reviews
            </Link>
            <span className="mx-1 w-px h-4 bg-border" aria-hidden />
            <Link
              href="/"
              className="rounded-lg px-3.5 py-2 text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors"
            >
              ← App
            </Link>
          </nav>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-6 py-8 pb-16">{children}</main>
    </div>
  );
}

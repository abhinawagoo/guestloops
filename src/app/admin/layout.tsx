import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getTenantFromHeaders } from "@/lib/tenant";
import { getTenantByIdAsync, getTenantBySlugAsync } from "@/lib/tenant-resolver";
import { createClient } from "@/lib/supabase/server";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const ctx = getTenantFromHeaders(headersList);
  const supabase = await createClient();
  const { data: { user } } = supabase ? await supabase.auth.getUser() : { data: { user: null } };

  if (!user) {
    const nextUrl = "/admin" + (ctx.tenantSlug ? `?tenant=${encodeURIComponent(ctx.tenantSlug)}` : "");
    redirect("/signin?next=" + encodeURIComponent(nextUrl));
  }

  let tenant = null;
  if (supabase) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", user.id)
      .single();
    if (profile?.tenant_id) {
      tenant = await getTenantByIdAsync(profile.tenant_id);
    }
  }

  if (!tenant && ctx.tenantId) {
    tenant = await getTenantByIdAsync(ctx.tenantId);
  }
  if (!tenant && ctx.tenantSlug) {
    tenant = await getTenantBySlugAsync(ctx.tenantSlug);
  }

  if (!tenant) {
    redirect("/signin?error=no_tenant");
  }

  const canonicalSlug = tenant.slug?.toLowerCase() ?? "";
  const requestedSlug = (ctx.tenantSlug ?? "").toLowerCase();
  if (requestedSlug !== canonicalSlug) {
    redirect("/admin?tenant=" + encodeURIComponent(canonicalSlug || tenant.slug));
  }

  const adminQuery = "?tenant=" + encodeURIComponent(canonicalSlug || tenant.slug);

  return (
    <div className="admin min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border/80 bg-card/95 backdrop-blur-md shadow-[0_1px_0_0_oklch(1_0_0_/_0.5)]">
        <div className="flex items-center justify-between max-w-5xl mx-auto px-6 py-4">
          <Link
            href={"/admin" + adminQuery}
            className="font-semibold text-lg tracking-tight text-foreground hover:text-primary transition-colors"
          >
            {tenant.name}
          </Link>
          <nav className="flex items-center gap-0.5 text-sm">
            <Link
              href={"/admin" + adminQuery}
              className="rounded-lg px-3.5 py-2 text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href={"/admin/onboarding" + adminQuery}
              className="rounded-lg px-3.5 py-2 text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors"
            >
              Setup
            </Link>
            <Link
              href={"/admin/settings" + adminQuery}
              className="rounded-lg px-3.5 py-2 text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors"
            >
              Settings
            </Link>
            <Link
              href={"/admin/benchmark" + adminQuery}
              className="rounded-lg px-3.5 py-2 text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors"
            >
              Competitors
            </Link>
            <Link
              href={"/admin/reviews" + adminQuery}
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

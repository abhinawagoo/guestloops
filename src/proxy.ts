import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getTenantContext, TENANT_HEADERS } from "@/lib/tenant";
import { getTenantBySlugAsync } from "@/lib/tenant-resolver";

const TENANT_COOKIE = "tenant_slug";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** Resolves tenant from subdomain / ?tenant= / cookie; sets x-tenant-slug and x-tenant-id. Slug→id uses cached resolver for concurrent scale. */
export async function proxy(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get("host") ?? "";
  const searchParams = url.searchParams;
  const headerTenant = request.headers.get("x-tenant-slug");
  const headerHost = request.headers.get("x-host-type");
  const cookieSlug = request.cookies.get(TENANT_COOKIE)?.value;
  const ctx = getTenantContext(
    hostname,
    searchParams,
    headerTenant ?? cookieSlug ?? undefined,
    headerHost
  );

  let tenantId: string | null = null;
  if (ctx.tenantSlug) {
    const tenant = await getTenantBySlugAsync(ctx.tenantSlug);
    tenantId = tenant?.id ?? null;
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(TENANT_HEADERS.HOST_TYPE, ctx.hostType);
  requestHeaders.set(TENANT_HEADERS.TENANT_SLUG, ctx.tenantSlug ?? "");
  requestHeaders.set(TENANT_HEADERS.TENANT_ID, tenantId ?? "");

  let res = NextResponse.next({ request: { headers: requestHeaders } });

  // Refresh Supabase session when configured (keeps auth state)
  if (supabaseUrl && supabaseAnonKey) {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options)
          );
        },
      },
    });
    await supabase.auth.getUser();
  }

  if (ctx.tenantSlug) {
    res.cookies.set(TENANT_COOKIE, ctx.tenantSlug, {
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax",
    });
  }

  if (ctx.hostType === "superadmin") {
    if (!url.pathname.startsWith("/superadmin")) {
      return NextResponse.redirect(new URL("/superadmin", url.origin));
    }
    return res;
  }

  if (ctx.hostType === "tenant" && url.pathname.startsWith("/superadmin")) {
    return NextResponse.redirect(new URL("/admin", url.origin));
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all paths so API routes also receive tenant headers (from cookie when on localhost).
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};

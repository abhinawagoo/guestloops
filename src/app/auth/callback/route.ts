import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/admin";

  if (!code) {
    return NextResponse.redirect(`${origin}/signin?error=missing_code`);
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.redirect(`${origin}/signin?error=config`);
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(`${origin}/signin?error=auth_callback_error`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  let tenantSlug = user?.user_metadata?.tenant_slug as string | undefined;

  if (!tenantSlug && user?.id) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", user.id)
      .single();
    if (profile?.tenant_id) {
      const { data: tenant } = await supabase
        .from("tenants")
        .select("slug")
        .eq("id", profile.tenant_id)
        .single();
      tenantSlug = tenant?.slug ?? undefined;
    }
  }

  const slug = tenantSlug ?? "demo";
  const base = next.startsWith("/") ? next : "/admin";
  const separator = base.includes("?") ? "&" : "?";
  const redirectTo = `${base}${slug ? `${separator}tenant=${slug}` : ""}`;
  return NextResponse.redirect(`${origin}${redirectTo}`);
}

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Get current user's tenant slug (for redirect after sign-in).
 * When Supabase is configured, reads profile.tenant_id and tenants.slug.
 * With in-memory only, returns null (use ?tenant= from signup redirect).
 */
export async function GET() {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ tenantSlug: null });
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ tenantSlug: null });
  }
  const slugFromMeta = user.user_metadata?.tenant_slug as string | undefined;
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", user.id)
      .single();
    if (!profile?.tenant_id) {
      return NextResponse.json({ tenantSlug: slugFromMeta ?? null });
    }
    const { data: tenant } = await supabase
      .from("tenants")
      .select("slug")
      .eq("id", profile.tenant_id)
      .single();
    return NextResponse.json({
      tenantSlug: tenant?.slug ?? slugFromMeta ?? null,
    });
  } catch {
    return NextResponse.json({ tenantSlug: slugFromMeta ?? null });
  }
}

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { exchangeCodeForTokens } from "@/lib/google-business";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  const origin = request.headers.get("origin") ?? url.origin;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? origin;
  const redirectUri = `${url.origin}/api/google/oauth/callback`;

  if (error) {
    const redirect = `${appUrl}/admin/settings?google=error&message=${encodeURIComponent(error)}`;
    return NextResponse.redirect(redirect);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${appUrl}/admin/settings?google=missing`);
  }

  const [tenantId, venueId] = state.split("|");

  try {
    const tokens = await exchangeCodeForTokens(code, redirectUri);
    const expiresAt = new Date(Date.now() + (tokens.expires_in - 60) * 1000);

    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.redirect(`${appUrl}/admin/settings?google=error`);
    }

    await supabase.from("google_oauth_tokens").upsert(
      {
        tenant_id: tenantId,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token ?? null,
        expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "tenant_id" }
    );

    const next = venueId
      ? `${appUrl}/admin/settings?google=connected&venueId=${encodeURIComponent(venueId)}`
      : `${appUrl}/admin/settings?google=connected`;
    return NextResponse.redirect(next);
  } catch (e) {
    console.error("[google/oauth/callback]", e);
    return NextResponse.redirect(
      `${appUrl}/admin/settings?google=error&message=${encodeURIComponent((e as Error).message)}`
    );
  }
}

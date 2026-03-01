/**
 * Meta WhatsApp Cloud API — Embedded Signup code exchange and WABA/phone fetch.
 * Used when tenant connects their WhatsApp via Meta Embedded Signup.
 */

const GRAPH_VERSION = "v22.0";

export type WhatsAppAccountData = {
  waba_id: string;
  phone_number_id: string;
  display_name: string;
  access_token: string;
};

/**
 * Exchange authorization code (from Embedded Signup) for access token.
 * redirectUri must match the URL used in the OAuth dialog (e.g. current page for Embedded Signup).
 */
export async function exchangeCodeForWhatsAppToken(
  code: string,
  redirectUri?: string
): Promise<{ access_token: string }> {
  const appId = process.env.META_APP_ID ?? process.env.NEXT_PUBLIC_META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  const resolvedRedirect =
    redirectUri ?? process.env.META_WHATSAPP_REDIRECT_URI ?? process.env.NEXT_PUBLIC_APP_URL;

  if (!appId || !appSecret) {
    throw new Error("META_APP_ID and META_APP_SECRET must be set");
  }

  const params = new URLSearchParams({
    client_id: appId,
    client_secret: appSecret,
    code,
    redirect_uri: resolvedRedirect ?? "",
  });

  const res = await fetch(
    `https://graph.facebook.com/${GRAPH_VERSION}/oauth/access_token?${params}`,
    { method: "GET" }
  );

  const data = (await res.json().catch(() => ({}))) as {
    access_token?: string;
    error?: { message?: string; code?: number };
  };

  if (!res.ok || data.error) {
    throw new Error(data.error?.message ?? "Failed to exchange code for token");
  }

  if (!data.access_token) {
    throw new Error("No access token in response");
  }

  return { access_token: data.access_token };
}

/**
 * Fetch WABA and phone numbers from Graph API using the token.
 * Returns first WABA and first phone number.
 */
export async function fetchWabaAndPhone(accessToken: string): Promise<WhatsAppAccountData | null> {
  const res = await fetch(
    `https://graph.facebook.com/${GRAPH_VERSION}/me?fields=whatsapp_business_accounts{id,name,phone_numbers{id,verified_name,display_phone_number}}&access_token=${encodeURIComponent(accessToken)}`,
    { method: "GET" }
  );

  const data = (await res.json().catch(() => ({}))) as {
    whatsapp_business_accounts?: {
      data?: Array<{
        id: string;
        name?: string;
        phone_numbers?: {
          data?: Array<{
            id: string;
            verified_name?: string;
            display_phone_number?: string;
          }>;
        };
      }>;
    };
    error?: { message?: string };
  };

  if (!res.ok || data.error) {
    console.error("[meta-whatsapp] fetchWabaAndPhone error:", data.error);
    return null;
  }

  const accounts = data.whatsapp_business_accounts?.data ?? [];
  const firstWaba = accounts[0];
  if (!firstWaba) return null;

  const phones = firstWaba.phone_numbers?.data ?? [];
  const firstPhone = phones[0];
  if (!firstPhone) return null;

  return {
    waba_id: firstWaba.id,
    phone_number_id: firstPhone.id,
    display_name: firstPhone.verified_name ?? firstWaba.name ?? firstPhone.display_phone_number ?? "WhatsApp",
    access_token: accessToken,
  };
}

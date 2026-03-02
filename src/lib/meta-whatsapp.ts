/**
 * Meta WhatsApp Cloud API — Embedded Signup code exchange and WABA/phone fetch.
 * Flow: code exchange → /me?fields=businesses → /{business-id}/owned_whatsapp_business_accounts → /{waba-id}/phone_numbers
 */

const GRAPH_VERSION = "v22.0";
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;

export type WhatsAppAccountData = {
  waba_id: string;
  phone_number_id: string;
  display_name: string;
  access_token: string;
};

// --- Code Exchange ---

/**
 * Exchange authorization code (from Embedded Signup) for access token.
 * redirect_uri MUST exactly match the URL configured in Meta OAuth settings.
 */
export async function exchangeCodeForWhatsAppToken(
  code: string,
  redirectUri?: string
): Promise<{ access_token: string }> {
  const appId = process.env.META_APP_ID ?? process.env.NEXT_PUBLIC_META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  const resolvedRedirect =
    redirectUri ?? process.env.META_WHATSAPP_REDIRECT_URI ?? `${process.env.NEXT_PUBLIC_APP_URL ?? "https://guestloops.com"}/api/auth/whatsapp/callback`;

  if (!appId || !appSecret) {
    throw new Error("META_APP_ID and META_APP_SECRET must be set");
  }

  const params = new URLSearchParams({
    client_id: appId,
    client_secret: appSecret,
    code,
    redirect_uri: resolvedRedirect,
  });

  const url = `${GRAPH_BASE}/oauth/access_token?${params}`;
  console.log("[meta-whatsapp] Token exchange: POST", GRAPH_BASE + "/oauth/access_token", {
    has_client_id: !!appId,
    has_client_secret: !!appSecret,
    redirect_uri: resolvedRedirect,
    code_length: code?.length ?? 0,
  });

  const res = await fetch(url, { method: "GET" });
  const data = (await res.json().catch(() => ({}))) as {
    access_token?: string;
    error?: { message?: string; code?: number; type?: string };
  };

  if (!res.ok || data.error) {
    const errMsg = data.error?.message ?? `HTTP ${res.status}`;
    console.error("[meta-whatsapp] Token exchange error:", { error: data.error, status: res.status });
    throw new Error(errMsg);
  }

  if (!data.access_token || data.access_token === "undefined") {
    console.error("[meta-whatsapp] Token exchange: no access_token in response", { keys: Object.keys(data) });
    throw new Error("No access token in response");
  }

  console.log("[meta-whatsapp] Token exchange success");

  // Log token scopes via /debug_token (uses app token: app_id|app_secret)
  const debugUrl = `${GRAPH_BASE}/debug_token?input_token=${encodeURIComponent(data.access_token)}&access_token=${encodeURIComponent(appId + "|" + appSecret)}`;
  try {
    const debugRes = await fetch(debugUrl);
    const debugData = (await debugRes.json()) as { data?: { scopes?: string[]; type?: string; is_valid?: boolean } };
    console.log("[meta-whatsapp] Token scopes:", debugData.data?.scopes ?? "unknown", "type:", debugData.data?.type);
  } catch (e) {
    console.warn("[meta-whatsapp] Could not fetch debug_token:", e);
  }

  return { access_token: data.access_token };
}

// --- Fetch WABA and Phone via businesses → owned_whatsapp_business_accounts → phone_numbers ---

async function graphGet<T>(path: string, accessToken: string): Promise<T> {
  const url = `${GRAPH_BASE}/${path.replace(/^\//, "")}`;
  const res = await fetch(url, {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return res.json() as Promise<T>;
}

export async function fetchWabaAndPhone(accessToken: string): Promise<WhatsAppAccountData | null> {
  if (!accessToken || accessToken === "undefined") {
    console.error("[meta-whatsapp] fetchWabaAndPhone: access_token is missing or undefined");
    return null;
  }
  console.log("[meta-whatsapp] fetchWabaAndPhone: token present, length:", accessToken.length);

  // Step 1: /me?fields=businesses
  const meData = await graphGet<{
    businesses?: { data?: Array<{ id: string; name?: string }> };
    error?: { message?: string; code?: number };
  }>("me?fields=businesses", accessToken);

  if (meData.error) {
    console.error("[meta-whatsapp] Business fetch error:", meData.error);
    throw new Error(meData.error.message ?? "Could not fetch businesses");
  }

  const businesses = meData.businesses?.data ?? [];
  if (businesses.length === 0) {
    console.error("[meta-whatsapp] No businesses returned", { meData });
    throw new Error("No businesses found for this user");
  }
  console.log("[meta-whatsapp] Business fetch success:", businesses.length, "business(es)");

  // Step 2: /{business-id}/owned_whatsapp_business_accounts
  let firstWaba: { id: string; name?: string } | null = null;
  for (const biz of businesses) {
    const wabaRes = await graphGet<{
      data?: Array<{ id: string; name?: string }>;
      error?: { message?: string; code?: number };
    }>(`${biz.id}/owned_whatsapp_business_accounts`, accessToken);

    if (wabaRes.error) {
      console.warn("[meta-whatsapp] WABA fetch for business", biz.id, "error:", wabaRes.error);
      continue;
    }
    const wabas = wabaRes.data ?? [];
    if (wabas.length > 0) {
      firstWaba = wabas[0];
      console.log("[meta-whatsapp] WABA fetch success:", firstWaba.id);
      break;
    }
  }

  if (!firstWaba) {
    console.error("[meta-whatsapp] No WABA found in any business");
    throw new Error("No WhatsApp Business Account found. Ensure the business has completed WhatsApp setup.");
  }

  // Step 3: /{waba-id}/phone_numbers
  const phoneRes = await graphGet<{
    data?: Array<{ id: string; verified_name?: string; display_phone_number?: string }>;
    error?: { message?: string; code?: number };
  }>(`${firstWaba.id}/phone_numbers`, accessToken);

  if (phoneRes.error) {
    console.error("[meta-whatsapp] Phone number fetch error:", phoneRes.error);
    throw new Error(phoneRes.error.message ?? "Could not fetch phone numbers");
  }

  const phones = phoneRes.data ?? [];
  const firstPhone = phones[0];
  if (!firstPhone) {
    console.error("[meta-whatsapp] No phone numbers for WABA", firstWaba.id);
    throw new Error("No phone number found for this WhatsApp Business Account");
  }
  console.log("[meta-whatsapp] Phone number fetch success:", firstPhone.id);

  return {
    waba_id: firstWaba.id,
    phone_number_id: firstPhone.id,
    display_name: firstPhone.verified_name ?? firstWaba.name ?? firstPhone.display_phone_number ?? "WhatsApp",
    access_token: accessToken,
  };
}

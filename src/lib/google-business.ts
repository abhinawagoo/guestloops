/**
 * Google Business Profile (My Business) API v4 helpers.
 * OAuth 2.0: authorize URL, token exchange, refresh. API: list accounts/locations, list reviews, updateReply.
 */

const GBP_SCOPE = "https://www.googleapis.com/auth/business.manage";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const API_BASE = "https://mybusiness.googleapis.com/v4";

export function getGoogleOAuthAuthorizeUrl(redirectUri: string, state: string): string {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) throw new Error("GOOGLE_CLIENT_ID not set");
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: GBP_SCOPE,
    state,
    access_type: "offline",
    prompt: "consent",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeCodeForTokens(
  code: string,
  redirectUri: string
): Promise<{ access_token: string; refresh_token?: string; expires_in: number }> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("Google OAuth credentials not set");

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Token exchange failed: ${res.status} ${err}`);
  }
  const data = (await res.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  };
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_in: data.expires_in ?? 3600,
  };
}

export async function refreshAccessToken(
  refreshToken: string
): Promise<{ access_token: string; expires_in: number }> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("Google OAuth credentials not set");

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Token refresh failed: ${res.status} ${err}`);
  }
  const data = (await res.json()) as { access_token: string; expires_in: number };
  return { access_token: data.access_token, expires_in: data.expires_in ?? 3600 };
}

async function gbpFetch(
  accessToken: string,
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = path.startsWith("http") ? path : `${API_BASE}/${path.replace(/^\//, "")}`;
  return fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
}

/** List accounts the authenticated user has access to. */
export async function listAccounts(accessToken: string): Promise<{ name: string; accountName?: string }[]> {
  const res = await gbpFetch(accessToken, "accounts");
  if (!res.ok) throw new Error(`listAccounts failed: ${res.status} ${await res.text()}`);
  const data = (await res.json()) as { accounts?: { name: string; accountName?: string }[] };
  return data.accounts ?? [];
}

/** List locations for an account. parent = "accounts/{accountId}". */
export async function listLocations(
  accessToken: string,
  accountId: string,
  pageToken?: string
): Promise<{ locations: { name: string; title?: string; storeCode?: string }[]; nextPageToken?: string }> {
  const path = `accounts/${accountId}/locations${pageToken ? `?pageToken=${encodeURIComponent(pageToken)}` : ""}`;
  const res = await gbpFetch(accessToken, path);
  if (!res.ok) throw new Error(`listLocations failed: ${res.status} ${await res.text()}`);
  const data = (await res.json()) as {
    locations?: { name: string; title?: string; storeCode?: string }[];
    nextPageToken?: string;
  };
  return {
    locations: data.locations ?? [],
    nextPageToken: data.nextPageToken,
  };
}

/** Single review from GBP API. */
export interface GBPReview {
  name: string;
  reviewer?: { displayName?: string; profilePhotoUrl?: string };
  starRating?: "ONE" | "TWO" | "THREE" | "FOUR" | "FIVE";
  comment?: string;
  reviewReply?: { comment?: string; updateTime?: string };
  createTime?: string;
  updateTime?: string;
}

const STAR_MAP: Record<string, number> = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 };

export function gbpStarToNumber(rating?: string): number {
  if (!rating) return 0;
  return STAR_MAP[rating] ?? 0;
}

/** List reviews for a location. parent = "accounts/{accountId}/locations/{locationId}". */
export async function listReviews(
  accessToken: string,
  accountId: string,
  locationId: string,
  options: { pageSize?: number; pageToken?: string; orderBy?: string } = {}
): Promise<{
  reviews: GBPReview[];
  averageRating?: number;
  totalReviewCount?: number;
  nextPageToken?: string;
}> {
  const params = new URLSearchParams();
  if (options.pageSize) params.set("pageSize", String(options.pageSize));
  if (options.pageToken) params.set("pageToken", options.pageToken);
  if (options.orderBy) params.set("orderBy", options.orderBy);
  const qs = params.toString();
  const path = `accounts/${accountId}/locations/${locationId}/reviews${qs ? `?${qs}` : ""}`;
  const res = await gbpFetch(accessToken, path);
  if (!res.ok) throw new Error(`listReviews failed: ${res.status} ${await res.text()}`);
  const data = (await res.json()) as {
    reviews?: GBPReview[];
    averageRating?: number;
    totalReviewCount?: number;
    nextPageToken?: string;
  };
  return {
    reviews: data.reviews ?? [],
    averageRating: data.averageRating,
    totalReviewCount: data.totalReviewCount,
    nextPageToken: data.nextPageToken,
  };
}

/** Post or update reply to a review. name = full review resource name (e.g. accounts/123/locations/456/reviews/789). */
export async function updateReviewReply(
  accessToken: string,
  reviewName: string,
  comment: string
): Promise<{ comment: string; updateTime?: string }> {
  const path = `${reviewName}/reply`;
  const res = await gbpFetch(accessToken, path, {
    method: "PUT",
    body: JSON.stringify({ comment: comment.slice(0, 4096) }),
  });
  if (!res.ok) throw new Error(`updateReviewReply failed: ${res.status} ${await res.text()}`);
  return res.json() as Promise<{ comment: string; updateTime?: string }>;
}

/** Get valid access token for tenant; refresh and persist if expired. Returns null if no tokens. */
export async function getValidAccessTokenForTenant(tenantId: string): Promise<string | null> {
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();
  if (!supabase) return null;

  const { data: row, error } = await supabase
    .from("google_oauth_tokens")
    .select("access_token, refresh_token, expires_at")
    .eq("tenant_id", tenantId)
    .single();

  if (error || !row) return null;
  const expiresAt = new Date((row as { expires_at: string }).expires_at).getTime();
  if (Date.now() < expiresAt + 60 * 1000) {
    return (row as { access_token: string }).access_token;
  }

  const refreshToken = (row as { refresh_token: string | null }).refresh_token;
  if (!refreshToken) return null;

  const { access_token, expires_in } = await refreshAccessToken(refreshToken);
  const newExpiresAt = new Date(Date.now() + (expires_in - 60) * 1000);
  await supabase
    .from("google_oauth_tokens")
    .update({
      access_token,
      expires_at: newExpiresAt.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("tenant_id", tenantId);
  return access_token;
}

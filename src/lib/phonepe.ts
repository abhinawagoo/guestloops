/**
 * PhonePe Payment Gateway – Standard Checkout API.
 * @see https://developer.phonepe.com/payment-gateway/website-integration/standard-checkout/api-integration/api-integration-website
 */

const SANDBOX = process.env.PHONEPE_SANDBOX === "true";
const AUTH_BASE = SANDBOX
  ? "https://api-preprod.phonepe.com/apis/pg-sandbox"
  : "https://api.phonepe.com/apis/identity-manager";
const PG_BASE = SANDBOX
  ? "https://api-preprod.phonepe.com/apis/pg-sandbox"
  : "https://api.phonepe.com/apis/pg";

let cachedToken: { access_token: string; expires_at: number } | null = null;
let lastAuthError: string | null = null;

/** Get OAuth token (cached until expiry). Required: client_id, client_version, client_secret. */
export async function getPhonePeAuthToken(): Promise<string | null> {
  const clientId = process.env.PHONEPE_CLIENT_ID?.trim();
  const clientVersion = (process.env.PHONEPE_CLIENT_VERSION?.trim() || "1.0").trim();
  const clientSecret = process.env.PHONEPE_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    lastAuthError = "PHONEPE_CLIENT_ID and PHONEPE_CLIENT_SECRET are required in env.";
    return null;
  }
  lastAuthError = null;
  const nowSec = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.expires_at > nowSec + 60) return cachedToken.access_token;

  const body = new URLSearchParams({
    client_id: clientId,
    client_version: clientVersion,
    client_secret: clientSecret,
    grant_type: "client_credentials",
  });

  const authUrl = `${AUTH_BASE}/v1/oauth/token`;
  const res = await fetch(authUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  const text = await res.text();
  if (!res.ok) {
    lastAuthError = `PhonePe auth failed (${res.status}). ${text.slice(0, 200)}`;
    console.error("[phonepe]", lastAuthError, "URL:", authUrl, "Sandbox:", SANDBOX);
    return null;
  }
  let data: { access_token?: string; expires_at?: number; issued_at?: number; message?: string };
  try {
    data = JSON.parse(text) as typeof data;
  } catch {
    lastAuthError = "Invalid JSON in auth response.";
    return null;
  }
  const token = data.access_token ?? null;
  if (!token) {
    lastAuthError = data.message ?? "No access_token in response.";
    return null;
  }
  const expiresAt = data.expires_at ?? (data.issued_at ?? nowSec) + 86400;
  cachedToken = { access_token: token, expires_at: expiresAt };
  return token;
}

/** Last auth error message (for API to return to client). */
export function getPhonePeLastAuthError(): string | null {
  return lastAuthError;
}

export interface CreatePaymentParams {
  merchantOrderId: string;
  amountPaisa: number;
  redirectUrl: string;
  expireAfterSeconds?: number;
  metaInfo?: Record<string, string>;
}

export interface CreatePaymentResult {
  orderId?: string;
  state?: string;
  redirectUrl?: string;
  expireAt?: number;
  code?: string;
  message?: string;
}

/** Create a payment order. Amount in paisa (min 100). redirectUrl = your callback URL. */
export async function createPhonePePayment(params: CreatePaymentParams): Promise<CreatePaymentResult> {
  const token = await getPhonePeAuthToken();
  if (!token) {
    const detail = getPhonePeLastAuthError();
    return { code: "AUTH_FAILED", message: detail ?? "PhonePe auth failed" };
  }

  const meta: Record<string, string> = {};
  if (params.metaInfo) {
    for (let i = 1; i <= 15; i++) {
      const key = `udf${i}`;
      const v = params.metaInfo[key];
      if (v) meta[key] = String(v).slice(0, i <= 10 ? 256 : 50);
    }
  }

  const payload = {
    merchantOrderId: params.merchantOrderId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 63),
    amount: Math.max(100, Math.round(params.amountPaisa)),
    ...(params.expireAfterSeconds && {
      expireAfter: Math.min(3600, Math.max(300, params.expireAfterSeconds)),
    }),
    paymentFlow: {
      type: "PG_CHECKOUT",
      merchantUrls: {
        redirectUrl: params.redirectUrl,
      },
    },
    ...(Object.keys(meta).length > 0 && { metaInfo: meta }),
  };

  const res = await fetch(`${PG_BASE}/checkout/v2/pay`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `O-Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const data = (await res.json()) as CreatePaymentResult & { redirectUrl?: string };
  if (!res.ok) {
    console.error("[phonepe] create payment failed", res.status, data);
    return { code: data.code ?? "ERROR", message: data.message ?? res.statusText };
  }
  return data;
}

export interface OrderStatusResult {
  orderId?: string;
  state?: "PENDING" | "COMPLETED" | "FAILED";
  amount?: number;
  expireAt?: number;
  metaInfo?: Record<string, string>;
  paymentDetails?: unknown[];
  code?: string;
  message?: string;
}

/** Check order status by merchantOrderId. */
export async function getPhonePeOrderStatus(merchantOrderId: string): Promise<OrderStatusResult> {
  const token = await getPhonePeAuthToken();
  if (!token) return { code: "AUTH_FAILED", message: "PhonePe auth failed" };

  const res = await fetch(
    `${PG_BASE}/checkout/v2/order/${encodeURIComponent(merchantOrderId)}/status?details=false`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `O-Bearer ${token}`,
      },
    }
  );
  const data = (await res.json()) as OrderStatusResult;
  if (!res.ok) {
    console.error("[phonepe] order status failed", res.status, data);
    return { code: data.code ?? "ERROR", message: data.message ?? res.statusText };
  }
  return data;
}

export function isPhonePeConfigured(): boolean {
  return !!(process.env.PHONEPE_CLIENT_ID && process.env.PHONEPE_CLIENT_SECRET);
}

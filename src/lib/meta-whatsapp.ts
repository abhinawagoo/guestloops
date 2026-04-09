/**
 * Meta WhatsApp Cloud API — Embedded Signup, template management, and message sending.
 * Flow: code exchange → /me?fields=businesses → /{business-id}/owned_whatsapp_business_accounts → /{waba-id}/phone_numbers
 */

const GRAPH_VERSION = "v22.0";
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;

// ─── Template Types ───────────────────────────────────────────────────────────

export type TemplateCategory = "MARKETING" | "UTILITY" | "AUTHENTICATION";
export type TemplateStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "PAUSED"
  | "DISABLED"
  | "IN_APPEAL"
  | "PENDING_DELETION";

export type TemplateHeaderFormat = "TEXT" | "IMAGE" | "VIDEO" | "DOCUMENT";
export type ButtonType = "URL" | "QUICK_REPLY" | "PHONE_NUMBER" | "COPY_CODE" | "OPT_OUT";

export type TemplateButton = {
  type: ButtonType;
  text: string;
  url?: string;          // for URL buttons; supports {{1}} variable suffix
  phone_number?: string; // for PHONE_NUMBER buttons (E.164)
};

export type TemplateComponent =
  | { type: "HEADER"; format: TemplateHeaderFormat; text?: string }
  | { type: "BODY"; text: string }
  | { type: "FOOTER"; text: string }
  | { type: "BUTTONS"; buttons: TemplateButton[] };

export type MetaTemplate = {
  id: string;
  name: string;
  category: TemplateCategory;
  language: string;
  status: TemplateStatus;
  components: TemplateComponent[];
  rejection_reason?: string;
  created_time?: string;
};

export type CreateTemplateInput = {
  name: string;
  category: TemplateCategory;
  language: string;
  components: TemplateComponent[];
};

// ─── Send Message Types ───────────────────────────────────────────────────────

export type SendMessageComponent = {
  type: "header" | "body" | "button";
  parameters: Array<{ type: "text"; text: string }>;
  sub_type?: "url" | "quick_reply";
  index?: number;
};

// ─── Template CRUD ────────────────────────────────────────────────────────────

/**
 * Create a new message template on the WABA.
 * Returns the Meta template ID and initial status (usually PENDING).
 */
export async function createWhatsAppTemplate(
  wabaId: string,
  accessToken: string,
  input: CreateTemplateInput
): Promise<{ id: string; status: TemplateStatus }> {
  const res = await fetch(`${GRAPH_BASE}/${wabaId}/message_templates`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
  const data = (await res.json().catch(() => ({}))) as {
    id?: string;
    status?: TemplateStatus;
    error?: { message?: string; error_user_title?: string; error_user_msg?: string };
  };
  if (!res.ok || data.error) {
    const msg = data.error?.error_user_msg ?? data.error?.message ?? `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return { id: data.id ?? "", status: data.status ?? "PENDING" };
}

/**
 * List all templates for a WABA (syncs status from Meta).
 */
export async function listWhatsAppTemplates(
  wabaId: string,
  accessToken: string
): Promise<MetaTemplate[]> {
  const fields = "id,name,status,category,language,components,rejection_reason,created_time";
  const res = await fetch(
    `${GRAPH_BASE}/${wabaId}/message_templates?fields=${fields}&limit=100`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const data = (await res.json().catch(() => ({}))) as {
    data?: MetaTemplate[];
    error?: { message?: string };
  };
  if (!res.ok || data.error) {
    throw new Error(data.error?.message ?? `HTTP ${res.status}`);
  }
  return data.data ?? [];
}

/**
 * Delete a template from the WABA by name.
 * Deleting by name removes ALL language variants.
 */
export async function deleteWhatsAppTemplate(
  wabaId: string,
  accessToken: string,
  templateName: string
): Promise<void> {
  const res = await fetch(`${GRAPH_BASE}/${wabaId}/message_templates`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name: templateName }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    success?: boolean;
    error?: { message?: string };
  };
  if (!res.ok || data.error) {
    throw new Error(data.error?.message ?? `HTTP ${res.status}`);
  }
}

// ─── Send Template Message ────────────────────────────────────────────────────

/**
 * Send a template message with variable substitution.
 * Components array maps variable values to header/body/button slots.
 */
export async function sendWhatsAppTemplateMessage(
  phoneNumberId: string,
  accessToken: string,
  to: string,
  templateName: string,
  languageCode: string,
  components?: SendMessageComponent[]
): Promise<{ messageId: string }> {
  const normalizedTo = to.replace(/\D/g, "").slice(-15);
  if (normalizedTo.length < 10) throw new Error("Invalid phone number");

  const payload = {
    messaging_product: "whatsapp",
    to: normalizedTo,
    type: "template",
    template: {
      name: templateName,
      language: { code: languageCode },
      ...(components && components.length > 0 ? { components } : {}),
    },
  };

  const res = await fetch(`${GRAPH_BASE}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const data = (await res.json().catch(() => ({}))) as {
    messages?: { id: string }[];
    error?: { message?: string; error_data?: { details?: string } };
  };
  if (!res.ok || data.error) {
    const msg = data.error?.error_data?.details ?? data.error?.message ?? `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return { messageId: data.messages?.[0]?.id ?? "" };
}

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
  return { access_token: data.access_token };
}

// --- Fetch WABA and Phone via businesses → owned_whatsapp_business_accounts → phone_numbers ---


/**
 * Extract WABA ID and Phone Number ID from the Embedded Signup token using
 * granular_scopes from debug_token. This is the correct approach for Embedded
 * Signup tokens — no business_management permission required.
 *
 * Meta grants:
 *   whatsapp_business_management → target_ids = [wabaId]
 *   whatsapp_business_messaging  → target_ids = [phoneNumberId]
 */
export async function fetchWabaAndPhone(accessToken: string): Promise<WhatsAppAccountData | null> {
  if (!accessToken || accessToken === "undefined") {
    console.error("[meta-whatsapp] fetchWabaAndPhone: access_token is missing or undefined");
    return null;
  }

  const appId = process.env.META_APP_ID ?? process.env.NEXT_PUBLIC_META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  if (!appId || !appSecret) {
    throw new Error("META_APP_ID and META_APP_SECRET must be set");
  }

  const appToken = `${appId}|${appSecret}`;

  // Use debug_token with granular_scopes — Embedded Signup tokens carry
  // the exact WABA ID and Phone Number ID the user selected.
  const debugUrl = `${GRAPH_BASE}/debug_token?input_token=${encodeURIComponent(accessToken)}&access_token=${encodeURIComponent(appToken)}&fields=granular_scopes,scopes,is_valid,expires_at`;

  const debugRes = await fetch(debugUrl);
  const debugData = (await debugRes.json()) as {
    data?: {
      is_valid?: boolean;
      scopes?: string[];
      granular_scopes?: Array<{ scope: string; target_ids?: string[] }>;
      expires_at?: number;
    };
    error?: { message?: string };
  };

  if (debugData.error) {
    console.error("[meta-whatsapp] debug_token error:", debugData.error);
    throw new Error(debugData.error.message ?? "Token validation failed");
  }

  const { granular_scopes = [], scopes = [], is_valid } = debugData.data ?? {};
  console.log("[meta-whatsapp] granular_scopes:", JSON.stringify(granular_scopes));
  console.log("[meta-whatsapp] scopes:", scopes, "is_valid:", is_valid);

  // Extract WABA ID from whatsapp_business_management scope
  const wabaScope = granular_scopes.find((s) => s.scope === "whatsapp_business_management");
  const wabaId = wabaScope?.target_ids?.[0];

  // Extract Phone Number ID from whatsapp_business_messaging scope
  const phoneScope = granular_scopes.find((s) => s.scope === "whatsapp_business_messaging");
  const phoneNumberId = phoneScope?.target_ids?.[0];

  if (!wabaId) {
    console.error("[meta-whatsapp] No WABA ID in granular_scopes:", granular_scopes);
    throw new Error(
      "No WhatsApp Business Account found in token. Make sure the Facebook Login for Business config includes whatsapp_business_management permission and the user completed the Embedded Signup flow."
    );
  }
  if (!phoneNumberId) {
    console.error("[meta-whatsapp] No Phone Number ID in granular_scopes:", granular_scopes);
    throw new Error(
      "No phone number found in token. Make sure the user added a phone number during the Embedded Signup flow."
    );
  }

  console.log("[meta-whatsapp] Got WABA ID:", wabaId, "Phone Number ID:", phoneNumberId);

  // Fetch display name from the phone number object
  const phoneRes = await fetch(
    `${GRAPH_BASE}/${phoneNumberId}?fields=verified_name,display_phone_number`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const phoneData = (await phoneRes.json().catch(() => ({}))) as {
    verified_name?: string;
    display_phone_number?: string;
    error?: { message?: string };
  };

  if (phoneData.error) {
    console.warn("[meta-whatsapp] Could not fetch phone display name:", phoneData.error.message);
  }

  const displayName =
    phoneData.verified_name ?? phoneData.display_phone_number ?? "WhatsApp Business";
  console.log("[meta-whatsapp] Display name:", displayName);

  return {
    waba_id: wabaId,
    phone_number_id: phoneNumberId,
    display_name: displayName,
    access_token: accessToken,
  };
}

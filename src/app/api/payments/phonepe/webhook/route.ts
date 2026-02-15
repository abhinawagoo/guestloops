import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { isPhonePeConfigured } from "@/lib/phonepe";

export const dynamic = "force-dynamic";

/**
 * Verify PhonePe webhook: Authorization header = SHA256(username:password).
 * @see https://developer.phonepe.com/payment-gateway/website-integration/standard-checkout/api-integration/api-reference/webhook
 */
function verifyWebhookSignature(request: Request): boolean {
  const username = process.env.PHONEPE_WEBHOOK_USERNAME;
  const password = process.env.PHONEPE_WEBHOOK_PASSWORD;
  if (!username || !password) return true;

  const authHeader = request.headers.get("Authorization");
  if (!authHeader) return false;

  const expectedHash = createHash("sha256")
    .update(`${username}:${password}`)
    .digest("hex");
  const expectedHeader = `SHA256 ${expectedHash}`;
  return authHeader === expectedHeader || authHeader === expectedHash;
}

type WebhookPayload = {
  orderId?: string;
  merchantId?: string;
  merchantOrderId?: string;
  state?: string;
  amount?: number;
  expireAt?: number;
  metaInfo?: Record<string, string>;
  paymentDetails?: unknown[];
};

/**
 * POST /api/payments/phonepe/webhook
 * PhonePe sends: checkout.order.completed, checkout.order.failed, pg.refund.completed, pg.refund.failed.
 * - Verify Authorization: SHA256(username:password).
 * - Use payload.state for payment status (recommended by PhonePe).
 * - Persist to phonepe_payments for idempotency and history.
 */
export async function POST(request: Request) {
  if (!isPhonePeConfigured()) {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  if (!verifyWebhookSignature(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as {
      event?: string;
      payload?: WebhookPayload;
    };
    const event = body.event;
    const payload = body.payload ?? {};

    if (!event) {
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const orderEvents = ["checkout.order.completed", "checkout.order.failed"];
    const refundEvents = ["pg.refund.completed", "pg.refund.failed"];
    const isOrderEvent = orderEvents.includes(event);
    const isRefundEvent = refundEvents.includes(event);

    const payloadRefund = payload as { refundId?: string; originalMerchantOrderId?: string };
    const merchantOrderId = payload.merchantOrderId ?? (isRefundEvent ? `refund_${payloadRefund.refundId ?? Date.now()}` : null);
    const state = payload.state ?? "UNKNOWN";

    if (merchantOrderId && (isOrderEvent || isRefundEvent)) {
      const db = createAdminClient();
      if (db) {
        const tenantId = payload.metaInfo?.udf2 ?? null;
        await db.from("phonepe_payments").upsert(
          {
            tenant_id: tenantId || undefined,
            merchant_order_id: merchantOrderId,
            phonepe_order_id: payload.orderId ?? payloadRefund.refundId ?? null,
            amount_paisa: typeof payload.amount === "number" ? payload.amount : null,
            state,
            event,
            meta_info: payload.metaInfo ?? {},
            raw_payload: body as unknown as object,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "merchant_order_id" }
        );
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch {
    return NextResponse.json({ received: true }, { status: 200 });
  }
}

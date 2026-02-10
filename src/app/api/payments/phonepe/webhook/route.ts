import { NextResponse } from "next/server";
import { isPhonePeConfigured } from "@/lib/phonepe";

export const dynamic = "force-dynamic";

/**
 * POST /api/payments/phonepe/webhook
 * PhonePe sends checkout.order.completed, checkout.order.failed, pg.refund.completed, pg.refund.failed.
 * Validate signature if PhonePe provides a secret; then persist or notify.
 * @see https://developer.phonepe.com/payment-gateway/website-integration/standard-checkout/api-integration/api-reference/webhook
 */
export async function POST(request: Request) {
  if (!isPhonePeConfigured()) {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  try {
    const body = await request.json().catch(() => ({})) as {
      event?: string;
      payload?: { merchantOrderId?: string; state?: string; orderId?: string };
    };
    const event = body.event;
    const payload = body.payload ?? {};

    if (event === "checkout.order.completed") {
      // Optional: update DB, send email, activate plan
      // const merchantOrderId = payload.merchantOrderId;
      // await updateTenantPlanOrRecordPayment(merchantOrderId, payload);
    } else if (event === "checkout.order.failed") {
      // Optional: log or notify
    }

    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ received: true }, { status: 200 });
  }
}

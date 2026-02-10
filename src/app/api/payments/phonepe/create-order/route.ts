import { NextResponse } from "next/server";
import {
  createPhonePePayment,
  isPhonePeConfigured,
} from "@/lib/phonepe";

export const dynamic = "force-dynamic";

/**
 * POST /api/payments/phonepe/create-order
 * Public/create-order without tenant context. For tenant payments use POST /api/admin/payments/phonepe/create-order (requires tenant auth).
 * Body: { amountPaisa: number, description?: string, plan?: string }
 * Returns: { redirectUrl, merchantOrderId, orderId } or error.
 */
export async function POST(request: Request) {
  if (!isPhonePeConfigured()) {
    return NextResponse.json(
      { error: "PhonePe is not configured. Set PHONEPE_CLIENT_ID and PHONEPE_CLIENT_SECRET." },
      { status: 503 }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const amountPaisa = Number(body.amountPaisa);
    const description = typeof body.description === "string" ? body.description.slice(0, 200) : "Payment";
    const plan = typeof body.plan === "string" ? body.plan : undefined;

    if (!Number.isFinite(amountPaisa) || amountPaisa < 100) {
      return NextResponse.json(
        { error: "amountPaisa must be at least 100 (₹1)" },
        { status: 400 }
      );
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      request.headers.get("origin") ||
      "http://localhost:3000";
    const merchantOrderId = `order_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    const callbackPath = "/payments/phonepe/callback";
    const redirectUrl = `${baseUrl.replace(/\/$/, "")}${callbackPath}?merchantOrderId=${encodeURIComponent(merchantOrderId)}`;

    const metaInfo: Record<string, string> = {};
    if (description) metaInfo.udf1 = description;
    if (plan) metaInfo.udf3 = plan;

    const result = await createPhonePePayment({
      merchantOrderId,
      amountPaisa,
      redirectUrl,
      expireAfterSeconds: 1200,
      metaInfo,
    });

    if (result.code || !result.redirectUrl) {
      return NextResponse.json(
        { error: result.message ?? "Failed to create order", code: result.code },
        { status: 400 }
      );
    }

    return NextResponse.json({
      redirectUrl: result.redirectUrl,
      merchantOrderId,
      orderId: result.orderId,
      state: result.state,
    });
  } catch (e) {
    console.error("[payments/phonepe/create-order]", e);
    return NextResponse.json(
      { error: "Failed to create payment order" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { getPhonePeOrderStatus, isPhonePeConfigured } from "@/lib/phonepe";

export const dynamic = "force-dynamic";

/**
 * GET /api/payments/phonepe/order-status?merchantOrderId=xxx
 * Returns order state: PENDING | COMPLETED | FAILED.
 */
export async function GET(request: Request) {
  if (!isPhonePeConfigured()) {
    return NextResponse.json(
      { error: "PhonePe is not configured" },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(request.url);
  const merchantOrderId = searchParams.get("merchantOrderId");
  if (!merchantOrderId) {
    return NextResponse.json(
      { error: "merchantOrderId required" },
      { status: 400 }
    );
  }

  try {
    const result = await getPhonePeOrderStatus(merchantOrderId);
    if (result.code && !result.state) {
      return NextResponse.json(
        { error: result.message ?? "Order not found", code: result.code },
        { status: 404 }
      );
    }
    return NextResponse.json({
      orderId: result.orderId,
      state: result.state,
      amount: result.amount,
      metaInfo: result.metaInfo,
    });
  } catch (e) {
    console.error("[payments/phonepe/order-status]", e);
    return NextResponse.json(
      { error: "Failed to fetch order status" },
      { status: 500 }
    );
  }
}

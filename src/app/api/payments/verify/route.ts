import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { ordersTable } from "@/db/schema";
import { clearCartCookie } from "@/lib/cart-cookie";
import { getRazorpayConfig } from "@/lib/razorpay";

function verifyRazorpaySignature({
  orderId,
  paymentId,
  signature,
  secret,
}: {
  orderId: string;
  paymentId: string;
  signature: string;
  secret: string;
}) {
  const expected = createHmac("sha256", secret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  const expectedBuffer = Buffer.from(expected, "utf8");
  const signatureBuffer = Buffer.from(signature, "utf8");

  if (expectedBuffer.length !== signatureBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, signatureBuffer);
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const razorpayConfig = getRazorpayConfig();
    if ("error" in razorpayConfig) {
      return NextResponse.json({ error: razorpayConfig.error }, { status: 500 });
    }

    const body = await req.json();
    const razorpayOrderId = String(body.razorpay_order_id ?? "");
    const razorpayPaymentId = String(body.razorpay_payment_id ?? "");
    const razorpaySignature = String(body.razorpay_signature ?? "");
    const orderId = Number(body.orderId);

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature || !Number.isFinite(orderId)) {
      return NextResponse.json({ error: "Invalid payment verification payload" }, { status: 400 });
    }

    const [order] = await db
      .select()
      .from(ordersTable)
      .where(and(eq(ordersTable.id, orderId), eq(ordersTable.userId, userId)))
      .limit(1);

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.status === "paid") {
      return NextResponse.json({ success: true, orderId: order.id });
    }

    if (order.razorpayOrderId !== razorpayOrderId) {
      return NextResponse.json({ error: "Order mismatch" }, { status: 400 });
    }

    const isValid = verifyRazorpaySignature({
      orderId: razorpayOrderId,
      paymentId: razorpayPaymentId,
      signature: razorpaySignature,
      secret: razorpayConfig.keySecret,
    });

    if (!isValid) {
      await db
        .update(ordersTable)
        .set({ status: "failed" })
        .where(eq(ordersTable.id, order.id));

      return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
    }

    await db
      .update(ordersTable)
      .set({
        status: "paid",
        razorpayPaymentId,
      })
      .where(eq(ordersTable.id, order.id));

    await clearCartCookie();

    return NextResponse.json({ success: true, orderId: order.id });
  } catch (error) {
    console.error("Verify payment error:", error);
    return NextResponse.json({ error: "Failed to verify payment" }, { status: 500 });
  }
}

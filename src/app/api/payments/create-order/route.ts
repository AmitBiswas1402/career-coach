import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orderItemsTable, ordersTable } from "@/db/schema";
import { readCartFromCookie } from "@/lib/cart-cookie";
import { calculateOrderTotalsPaise } from "@/lib/order-totals";
import { getRazorpayConfig } from "@/lib/razorpay";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Sign in to checkout" }, { status: 401 });
    }

    const razorpayConfig = getRazorpayConfig();
    if ("error" in razorpayConfig) {
      return NextResponse.json({ error: razorpayConfig.error }, { status: 500 });
    }

    const body = await req.json();
    const restaurantId = Number(body.restaurantId);

    if (!Number.isFinite(restaurantId)) {
      return NextResponse.json({ error: "Invalid restaurantId" }, { status: 400 });
    }

    const cart = await readCartFromCookie();

    if (!cart.items.length || cart.restaurantId !== restaurantId) {
      return NextResponse.json({ error: "Cart is empty or invalid for this restaurant" }, { status: 400 });
    }

    const totals = calculateOrderTotalsPaise({ items: cart.items });

    if (totals.total <= 0) {
      return NextResponse.json({ error: "Order total must be greater than zero" }, { status: 400 });
    }

    const [order] = await db
      .insert(ordersTable)
      .values({
        userId,
        restaurantId,
        razorpayOrderId: `pending_${Date.now()}_${userId}`,
        subtotal: totals.subtotal,
        deliveryFee: totals.deliveryFee,
        taxes: totals.taxes,
        total: totals.total,
        status: "pending",
      })
      .returning({ id: ordersTable.id });

    if (!order) {
      return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
    }

    await db.insert(orderItemsTable).values(
      cart.items.map((item) => ({
        orderId: order.id,
        menuItemId: item.menuItemId,
        name: item.name,
        price: Math.round(item.price * 100),
        quantity: item.quantity,
      }))
    );

    const razorpayOrder = await razorpayConfig.client.orders.create({
      amount: totals.total,
      currency: "INR",
      receipt: `order_${order.id}`,
    });

    await db
      .update(ordersTable)
      .set({ razorpayOrderId: razorpayOrder.id })
      .where(eq(ordersTable.id, order.id));

    const user = await currentUser();
    const email = user?.emailAddresses[0]?.emailAddress ?? "";
    const name = user?.fullName ?? user?.firstName ?? "Customer";

    return NextResponse.json({
      keyId: razorpayConfig.keyId,
      razorpayOrderId: razorpayOrder.id,
      amount: totals.total,
      currency: "INR",
      orderId: order.id,
      prefill: { name, email },
    });
  } catch (error) {
    console.error("Create payment order error:", error);
    return NextResponse.json({ error: "Failed to create payment order" }, { status: 500 });
  }
}

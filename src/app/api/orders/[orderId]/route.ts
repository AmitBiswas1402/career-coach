import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { orderItemsTable, ordersTable, restaurantsTable } from "@/db/schema";
import { formatPaiseAsRupees } from "@/lib/order-totals";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orderId: orderIdParam } = await params;
    const orderId = Number(orderIdParam);

    if (!Number.isFinite(orderId)) {
      return NextResponse.json({ error: "Invalid order id" }, { status: 400 });
    }

    const [order] = await db
      .select({
        id: ordersTable.id,
        status: ordersTable.status,
        subtotal: ordersTable.subtotal,
        deliveryFee: ordersTable.deliveryFee,
        taxes: ordersTable.taxes,
        total: ordersTable.total,
        razorpayPaymentId: ordersTable.razorpayPaymentId,
        createdAt: ordersTable.createdAt,
        restaurantId: ordersTable.restaurantId,
        restaurantName: restaurantsTable.name,
      })
      .from(ordersTable)
      .innerJoin(restaurantsTable, eq(restaurantsTable.id, ordersTable.restaurantId))
      .where(and(eq(ordersTable.id, orderId), eq(ordersTable.userId, userId)))
      .limit(1);

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const items = await db
      .select({
        id: orderItemsTable.id,
        name: orderItemsTable.name,
        price: orderItemsTable.price,
        quantity: orderItemsTable.quantity,
      })
      .from(orderItemsTable)
      .where(eq(orderItemsTable.orderId, orderId));

    return NextResponse.json({
      ...order,
      subtotal: formatPaiseAsRupees(order.subtotal),
      deliveryFee: formatPaiseAsRupees(order.deliveryFee),
      taxes: formatPaiseAsRupees(order.taxes),
      total: formatPaiseAsRupees(order.total),
      items: items.map((item) => ({
        ...item,
        price: formatPaiseAsRupees(item.price),
        lineTotal: formatPaiseAsRupees(item.price * item.quantity),
      })),
    });
  } catch (error) {
    console.error("Get order error:", error);
    return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 });
  }
}

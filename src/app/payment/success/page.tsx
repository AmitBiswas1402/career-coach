"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, Package } from "lucide-react";
import { SectionHeader } from "@/components/ui/SectionHeader";

type OrderItem = {
  id: number;
  name: string;
  price: number;
  quantity: number;
  lineTotal: number;
};

type OrderDetails = {
  id: number;
  status: string;
  subtotal: number;
  deliveryFee: number;
  taxes: number;
  total: number;
  razorpayPaymentId: string | null;
  createdAt: string;
  restaurantName: string;
  items: OrderItem[];
};

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      setError("No order id provided");
      setLoading(false);
      return;
    }

    const fetchOrder = async () => {
      try {
        const response = await fetch(`/api/orders/${orderId}`, { cache: "no-store" });
        const data = await response.json();

        if (!response.ok) {
          setError(data.error ?? "Failed to load order");
          return;
        }

        setOrder(data);
      } catch (fetchError) {
        console.error("Failed to fetch order:", fetchError);
        setError("Failed to load order details");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-slate-600">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        <p>Loading your order…</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-red-100 bg-white p-8 text-center shadow-sm">
        <p className="text-red-600">{error ?? "Order not found"}</p>
        <Link href="/search" className="btn-primary mt-6 inline-block px-6 py-2.5 text-sm">
          Browse Restaurants
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="rounded-2xl border border-green-100 bg-white p-6 text-center shadow-sm sm:p-8">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Payment Successful</h1>
        <p className="mt-2 text-slate-600">
          Your order from <span className="font-semibold text-gray-900">{order.restaurantName}</span> has been
          confirmed.
        </p>
        <p className="mt-1 text-sm text-slate-500">Order #{order.id}</p>
      </div>

      <div className="rounded-2xl border border-orange-100 bg-white p-6 shadow-sm">
        <SectionHeader title="Order Details" badge={order.status} className="mb-5" />

        <div className="divide-y divide-orange-50">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-4 py-3 text-sm">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-orange-400" />
                <span className="font-medium text-gray-900">
                  {item.name} × {item.quantity}
                </span>
              </div>
              <span className="text-gray-700">₹{item.lineTotal}</span>
            </div>
          ))}
        </div>

        <div className="mt-5 space-y-2 border-t border-orange-100 pt-4 text-sm text-gray-600">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>₹{order.subtotal}</span>
          </div>
          <div className="flex justify-between">
            <span>Delivery Fee</span>
            <span>₹{order.deliveryFee}</span>
          </div>
          <div className="flex justify-between">
            <span>Taxes</span>
            <span>₹{order.taxes}</span>
          </div>
          <div className="flex justify-between border-t border-orange-100 pt-3 text-base font-bold text-gray-900">
            <span>Total Paid</span>
            <span>₹{order.total}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link href="/search" className="btn-primary flex-1 py-3 text-center text-sm">
          Order More Food
        </Link>
        <Link
          href="/"
          className="flex-1 rounded-xl border border-orange-200 bg-white py-3 text-center text-sm font-semibold text-orange-700 transition hover:bg-orange-50"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <main className="min-h-screen bg-surface-cream px-4 py-10 sm:px-6">
      <Suspense
        fallback={
          <div className="flex min-h-[50vh] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          </div>
        }
      >
        <PaymentSuccessContent />
      </Suspense>
    </main>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useClerk } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";
import { getCart, updateCartItemQuantity, removeFromCart } from "@/actions/cart.action";
import { SectionHeader } from "@/components/ui/SectionHeader";

interface CartItem {
  menuItemId: number;
  quantity: number;
  name: string;
  price: number;
}

interface OrderSummaryProps {
  restaurantId: number;
  refreshTrigger: number;
}

function loadRazorpayScript() {
  return new Promise<boolean>((resolve) => {
    if (typeof window !== "undefined" && window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function OrderSummary({ restaurantId, refreshTrigger }: OrderSummaryProps) {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const { openSignIn } = useClerk();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCart = async () => {
      try {
        const result = await getCart();
        if (result.restaurantId === restaurantId && result.items) {
          setCart(result.items);
        } else {
          setCart([]);
        }
      } catch (error) {
        console.error("Error fetching cart:", error);
        setCart([]);
      }
    };

    fetchCart();
  }, [restaurantId, refreshTrigger]);

  const handleQuantityChange = async (menuItemId: number, newQuantity: number) => {
    try {
      setLoading(true);
      await updateCartItemQuantity(menuItemId, newQuantity);

      if (newQuantity <= 0) {
        setCart(cart.filter((item) => item.menuItemId !== menuItemId));
      } else {
        setCart(
          cart.map((item) =>
            item.menuItemId === menuItemId ? { ...item, quantity: newQuantity } : item
          )
        );
      }
    } catch (error) {
      console.error("Failed to update quantity:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (menuItemId: number) => {
    try {
      setLoading(true);
      await removeFromCart(menuItemId);
      setCart(cart.filter((item) => item.menuItemId !== menuItemId));
    } catch (error) {
      console.error("Failed to remove item:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = useCallback(async () => {
    setCheckoutError(null);

    if (!isSignedIn) {
      openSignIn();
      return;
    }

    if (!cart.length) {
      return;
    }

    try {
      setCheckoutLoading(true);

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded || !window.Razorpay) {
        setCheckoutError("Failed to load payment gateway. Please try again.");
        return;
      }

      const createResponse = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restaurantId }),
      });

      const createData = await createResponse.json();

      if (!createResponse.ok) {
        setCheckoutError(createData.error ?? "Failed to start checkout");
        return;
      }

      const razorpay = new window.Razorpay({
        key: createData.keyId,
        amount: createData.amount,
        currency: createData.currency,
        name: "Food",
        description: "Food delivery order",
        order_id: createData.razorpayOrderId,
        prefill: createData.prefill,
        handler: async (response) => {
          try {
            const verifyResponse = await fetch("/api/payments/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                orderId: createData.orderId,
              }),
            });

            const verifyData = await verifyResponse.json();

            if (!verifyResponse.ok) {
              setCheckoutError(verifyData.error ?? "Payment verification failed");
              return;
            }

            router.push(`/payment/success?orderId=${verifyData.orderId}`);
          } catch (error) {
            console.error("Payment verification error:", error);
            setCheckoutError("Payment verification failed. Please contact support.");
          }
        },
        modal: {
          ondismiss: () => setCheckoutLoading(false),
        },
      });

      razorpay.open();
    } catch (error) {
      console.error("Checkout error:", error);
      setCheckoutError("Something went wrong during checkout. Please try again.");
    } finally {
      setCheckoutLoading(false);
    }
  }, [cart.length, isSignedIn, openSignIn, restaurantId, router]);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = 40;
  const taxes = Math.round(subtotal * 0.1);
  const total = subtotal + deliveryFee + taxes;

  if (cart.length === 0) {
    return (
      <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm sm:p-6">
        <SectionHeader title="Order Summary" description="Your cart is empty. Add dishes from the menu." />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm sm:p-6">
      <SectionHeader title="Order Summary" badge={`${cart.length} items`} className="mb-6" />

      <div className="mb-6 divide-y divide-orange-50 border-b border-orange-100">
        {cart.map((item) => (
          <div key={item.menuItemId} className="flex items-center justify-between gap-3 py-4">
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-gray-900">{item.name}</p>
              <p className="text-sm text-orange-600">₹{item.price}</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleQuantityChange(item.menuItemId, item.quantity - 1)}
                disabled={loading || checkoutLoading}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-orange-200 bg-orange-50 text-sm font-semibold text-orange-700 transition hover:bg-orange-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 disabled:opacity-50"
              >
                −
              </button>
              <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
              <button
                type="button"
                onClick={() => handleQuantityChange(item.menuItemId, item.quantity + 1)}
                disabled={loading || checkoutLoading}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-orange-200 bg-orange-50 text-sm font-semibold text-orange-700 transition hover:bg-orange-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 disabled:opacity-50"
              >
                +
              </button>
              <button
                type="button"
                onClick={() => handleRemove(item.menuItemId)}
                disabled={loading || checkoutLoading}
                className="ml-1 rounded-lg px-2 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 disabled:opacity-50"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="mb-4 flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
          Updating cart…
        </div>
      ) : null}

      <div className="space-y-3">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Subtotal</span>
          <span>₹{subtotal}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-600">
          <span>Delivery Fee</span>
          <span>₹{deliveryFee}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-600">
          <span>Taxes (10%)</span>
          <span>₹{taxes}</span>
        </div>
      </div>

      <div className="mt-4 border-t border-orange-100 pt-4">
        <div className="mb-4 flex justify-between text-lg font-bold text-gray-900">
          <span>Total</span>
          <span>₹{total}</span>
        </div>

        {checkoutError ? (
          <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{checkoutError}</p>
        ) : null}

        <button
          type="button"
          onClick={handleCheckout}
          disabled={loading || checkoutLoading}
          className="btn-primary flex w-full items-center justify-center gap-2 py-3 text-sm disabled:opacity-60"
        >
          {checkoutLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing…
            </>
          ) : isSignedIn ? (
            "Proceed to Checkout"
          ) : (
            "Sign in to Checkout"
          )}
        </button>
      </div>
    </div>
  );
}

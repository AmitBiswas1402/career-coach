"use client";

import { useState, useEffect } from "react";
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

export function OrderSummary({ restaurantId, refreshTrigger }: OrderSummaryProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

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
                disabled={loading}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-orange-200 bg-orange-50 text-sm font-semibold text-orange-700 transition hover:bg-orange-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 disabled:opacity-50"
              >
                −
              </button>
              <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
              <button
                type="button"
                onClick={() => handleQuantityChange(item.menuItemId, item.quantity + 1)}
                disabled={loading}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-orange-200 bg-orange-50 text-sm font-semibold text-orange-700 transition hover:bg-orange-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 disabled:opacity-50"
              >
                +
              </button>
              <button
                type="button"
                onClick={() => handleRemove(item.menuItemId)}
                disabled={loading}
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
        <button
          type="button"
          className="btn-primary w-full py-3 text-sm"
        >
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
}

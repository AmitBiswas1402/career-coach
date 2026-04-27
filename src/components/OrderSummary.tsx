"use client";

import { useState, useEffect } from "react";
import { getCart, updateCartItemQuantity, removeFromCart } from "@/actions/cart.action";

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

      // Update local state
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
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="mb-4 text-2xl font-bold text-gray-900">Order Summary</h2>
        <p className="text-center text-gray-500">Your cart is empty</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="mb-6 text-2xl font-bold text-gray-900">Order Summary</h2>

      {/* Cart Items */}
      <div className="mb-6 divide-y divide-gray-100 border-b border-gray-200">
        {cart.map((item) => (
          <div key={item.menuItemId} className="flex items-center justify-between py-4">
            <div className="flex-1">
              <p className="font-medium text-gray-900">{item.name}</p>
              <p className="text-sm text-orange-600">₹{item.price}</p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => handleQuantityChange(item.menuItemId, item.quantity - 1)}
                disabled={loading}
                className="flex h-6 w-6 items-center justify-center rounded bg-gray-100 text-sm font-semibold hover:bg-gray-200 disabled:opacity-50"
              >
                −
              </button>
              <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
              <button
                onClick={() => handleQuantityChange(item.menuItemId, item.quantity + 1)}
                disabled={loading}
                className="flex h-6 w-6 items-center justify-center rounded bg-gray-100 text-sm font-semibold hover:bg-gray-200 disabled:opacity-50"
              >
                +
              </button>
              <button
                onClick={() => handleRemove(item.menuItemId)}
                disabled={loading}
                className="ml-2 rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pricing Details */}
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

      {/* Total */}
      <div className="mt-4 border-t border-gray-200 pt-4">
        <div className="mb-4 flex justify-between text-lg font-bold text-gray-900">
          <span>Total</span>
          <span>₹{total}</span>
        </div>
        <button className="w-full rounded-lg bg-orange-600 py-3 font-semibold text-white transition-all hover:bg-orange-700">
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
}

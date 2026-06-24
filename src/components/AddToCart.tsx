"use client";

import { useState } from "react";
import { addToCart } from "@/actions/cart.action";
import { cn } from "@/lib/utils";

interface AddToCartProps {
  menuItemId: number;
  restaurantId: number;
  itemName: string;
  itemPrice: number;
  onSuccess?: () => void;
}

export function AddToCart({
  menuItemId,
  restaurantId,
  itemName,
  itemPrice,
  onSuccess,
}: AddToCartProps) {
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);

  const handleAddToCart = async () => {
    try {
      setLoading(true);
      await addToCart(restaurantId, menuItemId, itemName, itemPrice, 1);
      setAdded(true);
      onSuccess?.();
      setTimeout(() => setAdded(false), 1200);
    } catch (error) {
      console.error("Failed to add to cart:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleAddToCart}
      disabled={loading}
      className={cn(
        "min-w-18 rounded-xl px-4 py-2 text-sm font-bold text-white shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 disabled:opacity-50",
        added ? "bg-green-600 hover:bg-green-600" : "btn-primary"
      )}
    >
      {loading ? "Adding…" : added ? "Added" : "Add"}
    </button>
  );
}

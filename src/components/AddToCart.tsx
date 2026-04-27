"use client";

import { useState } from "react";
import { addToCart } from "@/actions/cart.action";

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

  const handleAddToCart = async () => {
    try {
      setLoading(true);
      await addToCart(restaurantId, menuItemId, itemName, itemPrice, 1);
      onSuccess?.();
    } catch (error) {
      console.error("Failed to add to cart:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleAddToCart}
      disabled={loading}
      className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-orange-700 disabled:opacity-50"
    >
      {loading ? "Adding..." : "Add"}
    </button>
  );
}

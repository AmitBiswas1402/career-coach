
"use client";

import { useState, use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { restaurants } from "@/lib/resturants";
import { getCart } from "@/actions/cart.action";
import { AddToCart } from "@/components/AddToCart";
import { OrderSummary } from "@/components/OrderSummary";

interface CartItem {
  menuItemId: number;
  quantity: number;
  name: string;
  price: number;
}

export default function RestaurantPage({
  params,
}: {
  params: Promise<{ restaurantId: string }>;
}) {
  const { restaurantId: restaurantSlug } = use(params);
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [restaurantId, setRestaurantId] = useState<number | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const restaurantName = decodeURIComponent(restaurantSlug).replace(/-/g, " ");

  const restaurant = restaurants.find(
    (r) => r.name.toLowerCase() === restaurantName.toLowerCase()
  );

  // Fetch cart on mount and when refreshTrigger changes
  useEffect(() => {
    const fetchCart = async () => {
      if (restaurant) {
        setRestaurantId(restaurant.id);
        try {
          const result = await getCart();
          if (result.restaurantId === restaurant.id && result.items) {
            setCart(result.items);
          } else {
            setCart([]);
          }
        } catch (error) {
          console.error("Error fetching cart:", error);
          setCart([]);
        }
      }
    };

    fetchCart();
  }, [restaurant, refreshTrigger]);

  const handleCartRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  if (!restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Restaurant Not Found</h1>
          <button
            onClick={() => router.back()}
            className="bg-orange-600 text-white px-6 py-2 rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100">
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
            {restaurant.name}
          </h1>
          <p className="mt-2 text-base text-gray-500">{restaurant.type}</p>
          <div className="mt-6 flex flex-wrap gap-3 text-sm text-gray-600">
            <div className="rounded-lg bg-gray-100 px-4 py-2 font-medium">
              ⭐ {restaurant.rating}
            </div>
            <div className="rounded-lg bg-gray-100 px-4 py-2 font-medium">
              🚚 30–40 mins
            </div>
            <div className="rounded-lg bg-gray-100 px-4 py-2 font-medium">
              ₹40 Delivery
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-1 items-start gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:grid-cols-5 lg:gap-8 lg:px-8">
        <div className="lg:col-span-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="mb-1 text-2xl font-bold text-gray-900">Menu</h2>
            <p className="mb-6 text-sm text-gray-500">Choose your favorite dish and add it to cart.</p>

            <div className="divide-y divide-gray-100">
              {restaurant.menu.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-lg font-semibold text-gray-900">
                      {item.name}
                    </h3>
                    <p className="mt-1 text-xl font-bold text-orange-600">
                      ₹{item.price}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 text-2xl">
                      🍽️
                    </div>
                    <AddToCart
                      menuItemId={item.id}
                      restaurantId={restaurant.id}
                      itemName={item.name}
                      itemPrice={item.price}
                      onSuccess={handleCartRefresh}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 lg:sticky lg:top-24">
          {restaurantId && (
            <OrderSummary restaurantId={restaurantId} refreshTrigger={refreshTrigger} />
          )}
        </div>
      </div>
    </div>
  );
}
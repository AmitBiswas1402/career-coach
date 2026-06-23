
"use client";

import { useState, use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCart } from "@/actions/cart.action";
import { AddToCart } from "@/components/AddToCart";
import { OrderSummary } from "@/components/OrderSummary";
import Image from "next/image";

interface CartItem {
  menuItemId: number;
  quantity: number;
  name: string;
  price: number;
}

interface RestaurantData {
  id: number;
  name: string;
  image?: string | null;
  type: string;
  rating: string;
}

interface MenuItemData {
  id: number;
  restaurantId: number;
  name: string;
  price: number;
  image?: string | null;
  description?: string | null;
  categoryName?: string | null;
  isVeg?: boolean;
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
  const [restaurant, setRestaurant] = useState<RestaurantData | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItemData[]>([]);
  const [loading, setLoading] = useState(true);

  const parsedRestaurantId = Number(restaurantSlug);

  // Fetch cart on mount and when refreshTrigger changes
  useEffect(() => {
    const fetchCart = async () => {
      if (!Number.isFinite(parsedRestaurantId)) {
        setLoading(false);
        return;
      }
      try {
        const [restaurantResponse, menuResponse] = await Promise.all([
          fetch(`/api/restaurants?public=1&id=${parsedRestaurantId}`, { cache: "no-store" }),
          fetch(`/api/menu-items?public=1&restaurantId=${parsedRestaurantId}`, { cache: "no-store" }),
        ]);

        if (!restaurantResponse.ok || !menuResponse.ok) {
          throw new Error("Failed to load restaurant data");
        }

        const [restaurantData, menuData] = await Promise.all([
          restaurantResponse.json(),
          menuResponse.json(),
        ]);

        const selectedRestaurant = Array.isArray(restaurantData) ? restaurantData[0] : null;
        if (!selectedRestaurant) {
          setRestaurant(null);
          setMenuItems([]);
          setLoading(false);
          return;
        }

        setRestaurant(selectedRestaurant);
        setMenuItems(Array.isArray(menuData) ? menuData : []);
        setRestaurantId(selectedRestaurant.id);

        const result = await getCart();
        if (result.restaurantId === selectedRestaurant.id && result.items) {
          setCart(result.items);
        } else {
          setCart([]);
        }
      } catch (error) {
        console.error("Error fetching restaurant/cart:", error);
        setRestaurant(null);
        setMenuItems([]);
        setCart([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
  }, [parsedRestaurantId, refreshTrigger]);

  const handleCartRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Loading restaurant...</h1>
        </div>
      </div>
    );
  }

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
        <div className="relative h-56 w-full overflow-hidden">
          {restaurant.image ? (
            <Image
              src={restaurant.image}
              alt={restaurant.name}
              fill
              className="object-cover"
              sizes="100vw"
              priority
            />
          ) : (
            <div className="h-full w-full bg-linear-to-br from-orange-100 via-orange-50 to-white" />
          )}
          <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0">
            <div className="mx-auto max-w-7xl px-4 pb-6 sm:px-6 lg:px-8">
              <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
                {restaurant.name}
              </h1>
              <p className="mt-2 text-base text-white/90">{restaurant.type}</p>
              <div className="mt-4 flex flex-wrap gap-3 text-sm text-white/90">
                <div className="rounded-lg bg-white/15 px-4 py-2 font-medium backdrop-blur">
                  ⭐ {restaurant.rating}
                </div>
                <div className="rounded-lg bg-white/15 px-4 py-2 font-medium backdrop-blur">
                  🚚 30–40 mins
                </div>
                <div className="rounded-lg bg-white/15 px-4 py-2 font-medium backdrop-blur">
                  ₹40 Delivery
                </div>
              </div>
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
              {menuItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-lg font-semibold text-gray-900">
                      {item.name}
                    </h3>
                    {item.description && (
                      <p className="mt-1 line-clamp-2 text-sm text-gray-500">{item.description}</p>
                    )}
                    {item.categoryName && (
                      <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-orange-600">
                        {item.categoryName}
                      </p>
                    )}
                    <p className="mt-1 text-xl font-bold text-orange-600">
                      ₹{item.price}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-3">
                    <div className="relative h-16 w-20 overflow-hidden rounded-xl bg-orange-50">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-2xl">🍽️</div>
                      )}
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
"use client";

import { useState, use, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AddToCart } from "@/components/AddToCart";
import { OrderSummary } from "@/components/OrderSummary";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { SearchResultsSkeleton } from "@/components/ui/Skeleton";
import Image from "next/image";
import { ArrowLeft, Clock, IndianRupee, Star, Truck, UtensilsCrossed } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const [restaurantId, setRestaurantId] = useState<number | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [restaurant, setRestaurant] = useState<RestaurantData | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItemData[]>([]);
  const [loading, setLoading] = useState(true);

  const parsedRestaurantId = Number(restaurantSlug);

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
      } catch (error) {
        console.error("Error fetching restaurant/cart:", error);
        setRestaurant(null);
        setMenuItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
  }, [parsedRestaurantId, refreshTrigger]);

  const itemsByCategory = useMemo(() => {
    const groups = new Map<string, MenuItemData[]>();
    for (const item of menuItems) {
      const key = item.categoryName ?? "Other";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(item);
    }
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [menuItems]);

  const handleCartRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-cream px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SearchResultsSkeleton />
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-cream px-4">
        <div className="rounded-3xl border border-orange-100 bg-white p-10 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Restaurant Not Found</h1>
          <p className="mt-2 text-sm text-slate-500">This restaurant may be unavailable or unpublished.</p>
          <button
            type="button"
            onClick={() => router.push("/search")}
            className="btn-primary mt-6 px-6 py-2.5 text-sm"
          >
            Back to search
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-cream">
      <div className="border-b border-orange-100 bg-white">
        <div className="relative h-56 w-full overflow-hidden sm:h-64">
          {restaurant.image ? (
            <Image src={restaurant.image} alt={restaurant.name} fill className="object-cover" sizes="100vw" priority />
          ) : (
            <div className="h-full w-full bg-linear-to-br from-orange-100 via-orange-50 to-white" />
          )}
          <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/20 to-transparent" />
          <div className="absolute left-0 right-0 top-0">
            <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 lg:px-8">
              <Link
                href="/search"
                className="inline-flex items-center gap-1.5 rounded-full bg-black/30 px-3 py-1.5 text-sm font-medium text-white backdrop-blur transition hover:bg-black/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to search
              </Link>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0">
            <div className="mx-auto max-w-7xl px-4 pb-6 sm:px-6 lg:px-8">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/80">{restaurant.type}</p>
              <h1 className="mt-1 text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
                {restaurant.name}
              </h1>
              <div className="mt-4 flex flex-wrap gap-3 text-sm text-white/90">
                <div className="flex items-center gap-1.5 rounded-lg bg-white/15 px-4 py-2 font-medium backdrop-blur">
                  <Star className="h-4 w-4 fill-amber-300 text-amber-300" />
                  {restaurant.rating}
                </div>
                <div className="flex items-center gap-1.5 rounded-lg bg-white/15 px-4 py-2 font-medium backdrop-blur">
                  <Clock className="h-4 w-4" />
                  30–40 mins
                </div>
                <div className="flex items-center gap-1.5 rounded-lg bg-white/15 px-4 py-2 font-medium backdrop-blur">
                  <Truck className="h-4 w-4" />
                  <IndianRupee className="h-3.5 w-3.5" />
                  40 Delivery
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-1 items-start gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:grid-cols-5 lg:gap-8 lg:px-8">
        <div className="lg:col-span-3">
          <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm sm:p-6">
            <SectionHeader
              label="Menu"
              title="Choose your dishes"
              description="Add items to your cart and review the order summary on the right."
              className="mb-6"
            />

            {menuItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-orange-200 py-12 text-center">
                <UtensilsCrossed className="h-10 w-10 text-orange-300" />
                <p className="mt-3 font-semibold text-slate-800">No menu items yet</p>
                <p className="mt-1 text-sm text-slate-500">Check back soon for this restaurant&apos;s menu.</p>
              </div>
            ) : (
              <div className="space-y-8">
                {itemsByCategory.map(([categoryName, items]) => (
                  <div key={categoryName}>
                    <h3 className="sticky top-20 z-10 mb-3 bg-white py-1 text-sm font-bold uppercase tracking-wide text-orange-600">
                      {categoryName}
                    </h3>
                    <div className="divide-y divide-orange-50">
                      {items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="truncate text-lg font-semibold text-gray-900">{item.name}</h3>
                              <span
                                className={cn(
                                  "rounded-full px-2 py-0.5 text-[10px] font-bold",
                                  item.isVeg !== false ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
                                )}
                              >
                                {item.isVeg !== false ? "Veg" : "Non-veg"}
                              </span>
                            </div>
                            {item.description ? (
                              <p className="mt-1 line-clamp-2 text-sm text-gray-500">{item.description}</p>
                            ) : null}
                            <p className="mt-2 text-xl font-bold text-orange-600">₹{item.price}</p>
                          </div>

                          <div className="flex shrink-0 flex-col items-end gap-3">
                            <div className="relative h-16 w-20 overflow-hidden rounded-xl border border-orange-100 bg-orange-50">
                              {item.image ? (
                                <Image src={item.image} alt={item.name} fill className="object-cover" sizes="80px" />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-orange-300">
                                  <UtensilsCrossed className="h-5 w-5" />
                                </div>
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
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 lg:sticky lg:top-24">
          {restaurantId ? (
            <OrderSummary restaurantId={restaurantId} refreshTrigger={refreshTrigger} />
          ) : null}
        </div>
      </div>
    </div>
  );
}

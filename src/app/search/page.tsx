"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { SearchResultsSkeleton } from "@/components/ui/Skeleton";
import { RestaurantCard } from "@/components/RestaurantCard";
import { FoodItemCard } from "@/components/FoodItemCard";

type PublicRestaurant = {
  id: number;
  name: string;
  address: string | null;
  image: string | null;
  type: string;
  rating: string;
  categories: { id: number; name: string }[];
};

type PublicMenuItem = {
  id: number;
  restaurantId: number;
  restaurantName: string;
  name: string;
  price: number;
  image: string | null;
  description: string | null;
  categoryId: number | null;
  categoryName: string | null;
  isVeg: boolean;
};

function SearchPageContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("query") || "";
  const normalizedQuery = query.trim().toLowerCase();
  const [restaurants, setRestaurants] = useState<PublicRestaurant[]>([]);
  const [menuItems, setMenuItems] = useState<PublicMenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadResults = async () => {
      setLoading(true);
      setError(null);
      try {
        const [restaurantsResponse, menuItemsResponse] = await Promise.all([
          fetch("/api/restaurants?public=1", { cache: "no-store" }),
          fetch("/api/menu-items?public=1", { cache: "no-store" }),
        ]);

        if (!restaurantsResponse.ok || !menuItemsResponse.ok) {
          throw new Error("Failed to fetch search data");
        }

        const [restaurantData, menuItemData] = await Promise.all([
          restaurantsResponse.json(),
          menuItemsResponse.json(),
        ]);

        if (!mounted) return;
        setRestaurants(Array.isArray(restaurantData) ? restaurantData : []);
        setMenuItems(Array.isArray(menuItemData) ? menuItemData : []);
      } catch (fetchError) {
        if (!mounted) return;
        setError(fetchError instanceof Error ? fetchError.message : "Failed to load search results");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadResults();
    return () => {
      mounted = false;
    };
  }, []);

  const filteredRestaurants = useMemo(
    () =>
      restaurants.filter((restaurant) => {
        if (!normalizedQuery) return true;

        const matchesCategory = restaurant.categories.some((category) =>
          category.name.toLowerCase().includes(normalizedQuery)
        );

        return (
          restaurant.type.toLowerCase().includes(normalizedQuery) ||
          restaurant.name.toLowerCase().includes(normalizedQuery) ||
          (restaurant.address ?? "").toLowerCase().includes(normalizedQuery) ||
          matchesCategory ||
          menuItems.some(
            (item) =>
              item.restaurantId === restaurant.id &&
              (item.name.toLowerCase().includes(normalizedQuery) ||
                (item.description ?? "").toLowerCase().includes(normalizedQuery) ||
                (item.categoryName ?? "").toLowerCase().includes(normalizedQuery))
          )
        );
      }),
    [menuItems, normalizedQuery, restaurants]
  );

  const filteredMenuItems = useMemo(
    () =>
      menuItems.filter((item) => {
        if (!normalizedQuery) return true;
        return (
          item.name.toLowerCase().includes(normalizedQuery) ||
          (item.description ?? "").toLowerCase().includes(normalizedQuery) ||
          (item.categoryName ?? "").toLowerCase().includes(normalizedQuery) ||
          item.restaurantName.toLowerCase().includes(normalizedQuery)
        );
      }),
    [menuItems, normalizedQuery]
  );

  return (
    <div className="min-h-screen bg-surface-cream px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 rounded-3xl border border-orange-100 bg-white/90 p-6 shadow-sm backdrop-blur">
          <SectionHeader
            label="Search Results"
            title={query ? `Results for "${query}"` : "Explore restaurants and food"}
            description="Browse published restaurants and food items that match your search."
          />
        </div>

        {loading ? (
          <SearchResultsSkeleton />
        ) : error ? (
          <div className="rounded-3xl border border-red-200 bg-white p-10 text-center text-red-600 shadow-sm">
            {error}
          </div>
        ) : (
          <div className="space-y-12">
            <section>
              <SectionHeader
                title="Restaurants"
                badge={`${filteredRestaurants.length} found`}
                className="mb-5"
              />
              {filteredRestaurants.length > 0 ? (
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {filteredRestaurants.map((restaurant) => (
                    <RestaurantCard key={restaurant.id} restaurant={restaurant} />
                  ))}
                </div>
              ) : (
                <div className="rounded-3xl border border-dashed border-orange-200 bg-white p-8 text-center text-gray-500 shadow-sm">
                  No restaurants found.
                </div>
              )}
            </section>

            <section>
              <SectionHeader
                title="Food items"
                badge={`${filteredMenuItems.length} found`}
                className="mb-5"
              />
              {filteredMenuItems.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {filteredMenuItems.map((item) => (
                    <FoodItemCard key={item.id} item={item} />
                  ))}
                </div>
              ) : (
                <div className="rounded-3xl border border-dashed border-orange-200 bg-white p-8 text-center text-gray-500 shadow-sm">
                  No food items found.
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center bg-surface-cream">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </div>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";

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

export default function SearchPage() {
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

  const filteredRestaurants = useMemo(() => restaurants.filter((restaurant) => {
    if (!normalizedQuery) {
      return true;
    }

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
  }), [menuItems, normalizedQuery, restaurants]);

  const filteredMenuItems = useMemo(() => menuItems.filter((item) => {
    if (!normalizedQuery) return true;
    return (
      item.name.toLowerCase().includes(normalizedQuery) ||
      (item.description ?? "").toLowerCase().includes(normalizedQuery) ||
      (item.categoryName ?? "").toLowerCase().includes(normalizedQuery) ||
      item.restaurantName.toLowerCase().includes(normalizedQuery)
    );
  }), [menuItems, normalizedQuery]);

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-white to-orange-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 rounded-3xl border border-orange-100 bg-white/90 p-6 shadow-sm backdrop-blur">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-orange-600">
            Search Results
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            {query ? `Results for "${query}"` : "Explore restaurants and food"}
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-gray-600 sm:text-base">
            Browse published restaurants and food items that match your search.
          </p>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-500 shadow-sm">
            Loading search results...
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-red-200 bg-white p-10 text-center text-red-600 shadow-sm">
            {error}
          </div>
        ) : (
          <div className="space-y-8">
            <section>
              <h2 className="mb-4 text-2xl font-bold text-gray-900">Restaurants</h2>
              {filteredRestaurants.length > 0 ? (
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {filteredRestaurants.map((restaurant) => (
                <Link
                  key={restaurant.id}
                  href={`/search/${restaurant.id}`}
                  className="group overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="relative h-40">
                    {restaurant.image ? (
                      <Image
                        src={restaurant.image}
                        alt={restaurant.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                        priority={false}
                      />
                    ) : (
                      <div className="h-full w-full bg-linear-to-br from-orange-100 via-orange-50 to-white" />
                    )}
                    <div className="absolute inset-0 bg-linear-to-t from-black/55 via-black/15 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-5">
                      <div className="flex items-end justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/90">
                            {restaurant.type}
                          </p>
                          <h2 className="mt-1 truncate text-2xl font-bold tracking-tight text-white">
                            {restaurant.name}
                          </h2>
                        </div>
                        <div className="shrink-0 rounded-full bg-white/90 px-3 py-1 text-sm font-semibold text-orange-600 shadow-sm">
                          ⭐ {restaurant.rating}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 p-5">
                    <p className="line-clamp-2 text-sm leading-6 text-gray-600">
                      {restaurant.address || "Address not available"}
                    </p>

                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>Open restaurant menu</span>
                      <span className="font-semibold text-orange-600 transition-transform duration-300 group-hover:translate-x-1">
                        View details →
                      </span>
                    </div>
                  </div>
                </Link>
                  ))}
                </div>
              ) : (
                <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-6 text-center text-gray-500 shadow-sm">
                  No restaurants found.
                </div>
              )}
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-bold text-gray-900">Food items</h2>
              {filteredMenuItems.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {filteredMenuItems.map((item) => (
                    <Link
                      key={item.id}
                      href={`/search/${item.restaurantId}`}
                      className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md"
                    >
                      <div className="flex gap-4 p-4">
                        <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-xl bg-orange-50">
                          {item.image ? (
                            <Image
                              src={item.image}
                              alt={item.name}
                              fill
                              className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                              sizes="96px"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-2xl">🍽️</div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold uppercase tracking-wide text-orange-600">
                            {item.categoryName || "Food"}
                          </p>
                          <h3 className="mt-1 truncate text-lg font-bold text-gray-900">{item.name}</h3>
                          <p className="mt-1 truncate text-sm text-gray-500">{item.restaurantName}</p>
                          <p className="mt-2 line-clamp-2 text-sm text-gray-600">{item.description || "No description available"}</p>
                          <p className="mt-3 text-base font-semibold text-orange-600">₹{item.price}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-6 text-center text-gray-500 shadow-sm">
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

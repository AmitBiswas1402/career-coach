"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { restaurants } from "@/lib/resturants";
import { foodCategories } from "@/lib/foods";

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get("query") || "";
  const normalizedQuery = query.trim().toLowerCase();

  const categoryNameById = new Map(
    foodCategories.map((category) => [category.id, category.name.toLowerCase()])
  );

  const filteredRestaurants = restaurants.filter((restaurant) => {
    if (!normalizedQuery) {
      return true;
    }

    const matchesCategory = restaurant.categories.some((categoryId) => {
      const categoryName = categoryNameById.get(categoryId);
      return categoryName?.includes(normalizedQuery);
    });

    const matchesMenuItem = restaurant.menu.some((item) =>
      item.name.toLowerCase().includes(normalizedQuery)
    );

    return (
      restaurant.type.toLowerCase().includes(normalizedQuery) ||
      restaurant.name.toLowerCase().includes(normalizedQuery) ||
      restaurant.description.toLowerCase().includes(normalizedQuery) ||
      matchesCategory ||
      matchesMenuItem
    );
  });

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-white to-orange-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 rounded-3xl border border-orange-100 bg-white/90 p-6 shadow-sm backdrop-blur">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-orange-600">
            Search Results
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            {query ? `Restaurants for "${query}"` : "Explore restaurants"}
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-gray-600 sm:text-base">
            Browse places that match your search and open a restaurant to view its menu.
          </p>
        </div>

        {filteredRestaurants.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filteredRestaurants.map((restaurant) => {
              const restaurantSlug = encodeURIComponent(
                restaurant.name.toLowerCase().replace(/\s+/g, "-")
              );

              return (
                <Link
                  key={restaurant.id}
                  href={`/search/${restaurantSlug}`}
                  className="group overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="h-36 bg-linear-to-br from-orange-100 via-orange-50 to-white p-5">
                    <div className="flex h-full items-end justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-600">
                          {restaurant.type}
                        </p>
                        <h2 className="mt-2 text-2xl font-bold tracking-tight text-gray-900">
                          {restaurant.name}
                        </h2>
                      </div>
                      <div className="rounded-full bg-white/90 px-3 py-1 text-sm font-semibold text-orange-600 shadow-sm">
                        ⭐ {restaurant.rating}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 p-5">
                    <p className="line-clamp-2 text-sm leading-6 text-gray-600">
                      {restaurant.description}
                    </p>

                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>Click to open menu</span>
                      <span className="font-semibold text-orange-600 transition-transform duration-300 group-hover:translate-x-1">
                        View details →
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-500 shadow-sm">
            No restaurants found for "{query}".
          </div>
        )}
      </div>
    </div>
  );
}

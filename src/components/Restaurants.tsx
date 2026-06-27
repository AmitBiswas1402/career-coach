"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Star, Store } from "lucide-react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Skeleton } from "@/components/ui/Skeleton";

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
  price: number;
};

const typeLabels: Record<string, string> = {
  veg: "Pure veg",
  "non-veg": "Non-veg",
  both: "Veg & non-veg",
};

function formatTypeLabel(type: string) {
  return typeLabels[type] ?? type.replace(/-/g, " ");
}

function RestaurantsSkeleton() {
  return (
    <div className="flex gap-4 overflow-hidden pb-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="w-[280px] shrink-0 overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-sm sm:w-[320px]"
        >
          <Skeleton className="h-44 rounded-none sm:h-48" />
          <div className="space-y-3 p-4">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-8 w-full rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Restaurants() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [restaurants, setRestaurants] = useState<PublicRestaurant[]>([]);
  const [menuItems, setMenuItems] = useState<PublicMenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadRestaurants = async () => {
      setLoading(true);
      setError(null);
      try {
        const [restaurantsResponse, menuItemsResponse] = await Promise.all([
          fetch("/api/restaurants?public=1", { cache: "no-store" }),
          fetch("/api/menu-items?public=1", { cache: "no-store" }),
        ]);

        if (!restaurantsResponse.ok || !menuItemsResponse.ok) {
          throw new Error("Failed to load restaurants");
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
        setError(fetchError instanceof Error ? fetchError.message : "Failed to load restaurants");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadRestaurants();
    return () => {
      mounted = false;
    };
  }, []);

  const minPriceByRestaurant = useMemo(() => {
    const prices = new Map<number, number>();
    for (const item of menuItems) {
      const current = prices.get(item.restaurantId);
      if (current === undefined || item.price < current) {
        prices.set(item.restaurantId, item.price);
      }
    }
    return prices;
  }, [menuItems]);

  const updateScrollButtons = () => {
    const container = scrollRef.current;
    if (!container) return;
    setCanScrollLeft(container.scrollLeft > 8);
    setCanScrollRight(container.scrollLeft + container.clientWidth < container.scrollWidth - 8);
  };

  useEffect(() => {
    updateScrollButtons();
    const container = scrollRef.current;
    if (!container) return;

    const handleScroll = () => updateScrollButtons();
    container.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);

    return () => {
      container.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [restaurants, loading]);

  const scrollCarousel = (direction: "left" | "right") => {
    scrollRef.current?.scrollBy({
      left: direction === "left" ? -340 : 340,
      behavior: "smooth",
    });
  };

  return (
    <section className="bg-surface-cream px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <SectionHeader
            label="Hot picks"
            title="Discover best restaurants"
            description="Order from top-rated spots near you — browse menus and add to cart in seconds."
          />
          <div className="flex items-center gap-2">
            <Link
              href="/search"
              className="mr-2 text-sm font-semibold text-orange-600 transition hover:text-orange-700"
            >
              View all
            </Link>
            <button
              type="button"
              aria-label="Scroll restaurants left"
              onClick={() => scrollCarousel("left")}
              disabled={!canScrollLeft || loading}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-orange-200 bg-white text-slate-700 shadow-sm transition hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Scroll restaurants right"
              onClick={() => scrollCarousel("right")}
              disabled={!canScrollRight || loading}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-orange-200 bg-white text-slate-700 shadow-sm transition hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {loading ? (
          <RestaurantsSkeleton />
        ) : error ? (
          <div className="rounded-3xl border border-red-200 bg-white p-10 text-center text-red-600 shadow-sm">
            {error}
          </div>
        ) : restaurants.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-orange-200 bg-white px-6 py-16 text-center shadow-sm">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50">
              <Store className="h-7 w-7 text-orange-400" />
            </div>
            <p className="mt-4 text-lg font-bold text-slate-800">No restaurants live yet</p>
            <p className="mt-2 max-w-md text-sm text-slate-500">
              Check back soon — restaurant owners can publish their menus from the owner dashboard.
            </p>
          </div>
        ) : (
          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {restaurants.map((restaurant) => {
              const cuisineLine =
                restaurant.categories.length > 0
                  ? restaurant.categories.map((cat) => cat.name).join(" • ")
                  : formatTypeLabel(restaurant.type);
              const minPrice = minPriceByRestaurant.get(restaurant.id);

              return (
                <Link
                  key={restaurant.id}
                  href={`/search/${restaurant.id}`}
                  className="group w-[280px] shrink-0 snap-start overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 sm:w-[320px]"
                >
                  <div className="relative h-44 sm:h-48">
                    {restaurant.image ? (
                      <Image
                        src={restaurant.image}
                        alt={restaurant.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="320px"
                      />
                    ) : (
                      <div className="h-full w-full bg-linear-to-br from-orange-100 via-amber-50 to-white" />
                    )}
                    <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between gap-3 p-4">
                      <h3 className="line-clamp-2 text-lg font-bold leading-tight text-white">{restaurant.name}</h3>
                      <div className="flex shrink-0 items-center gap-1 rounded-lg bg-green-600 px-2 py-1 text-xs font-bold text-white shadow-sm">
                        <Star className="h-3 w-3 fill-white text-white" />
                        {restaurant.rating}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-3 text-sm">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-800">{cuisineLine}</p>
                        <p className="mt-0.5 truncate text-slate-500">
                          {restaurant.address || "Location not listed"}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        {minPrice !== undefined ? (
                          <>
                            <p className="font-semibold text-slate-800">₹{minPrice}+</p>
                            <p className="text-xs text-slate-500">starts at</p>
                          </>
                        ) : (
                          <>
                            <p className="font-semibold text-slate-800">Menu</p>
                            <p className="text-xs text-slate-500">coming soon</p>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="overflow-hidden rounded-xl bg-linear-to-r from-orange-500 to-amber-500 px-3 py-2 text-xs font-bold text-white">
                      Order now · {formatTypeLabel(restaurant.type)}
                    </div>
                    <div className="rounded-xl border border-orange-100 bg-orange-50/80 px-3 py-2 text-xs font-semibold text-orange-700">
                      Browse full menu and add to cart
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

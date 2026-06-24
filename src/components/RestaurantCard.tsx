import Link from "next/link";
import Image from "next/image";
import { Star } from "lucide-react";

export type RestaurantCardData = {
  id: number;
  name: string;
  address: string | null;
  image: string | null;
  type: string;
  rating: string;
  categories?: { id: number; name: string }[];
};

export function RestaurantCard({ restaurant }: { restaurant: RestaurantCardData }) {
  return (
    <Link
      href={`/search/${restaurant.id}`}
      className="group overflow-hidden rounded-3xl border border-orange-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
    >
      <div className="relative h-40">
        {restaurant.image ? (
          <Image
            src={restaurant.image}
            alt={restaurant.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
          />
        ) : (
          <div className="h-full w-full bg-linear-to-br from-orange-100 via-orange-50 to-white" />
        )}
        <div className="absolute inset-0 bg-linear-to-t from-black/55 via-black/15 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/90">{restaurant.type}</p>
              <h2 className="mt-1 truncate text-2xl font-bold tracking-tight text-white">{restaurant.name}</h2>
            </div>
            <div className="flex shrink-0 items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-sm font-semibold text-orange-600 shadow-sm">
              <Star className="h-3.5 w-3.5 fill-orange-500 text-orange-500" />
              {restaurant.rating}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4 p-5">
        <p className="line-clamp-2 text-sm leading-6 text-gray-600">
          {restaurant.address || "Address not available"}
        </p>
        {restaurant.categories && restaurant.categories.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {restaurant.categories.slice(0, 3).map((cat) => (
              <span
                key={cat.id}
                className="rounded-full bg-orange-50 px-2.5 py-0.5 text-xs font-semibold text-orange-700"
              >
                {cat.name}
              </span>
            ))}
          </div>
        ) : null}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Open restaurant menu</span>
          <span className="font-semibold text-orange-600 transition-transform duration-300 group-hover:translate-x-1">
            View details →
          </span>
        </div>
      </div>
    </Link>
  );
}

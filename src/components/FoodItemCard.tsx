import Link from "next/link";
import Image from "next/image";
import { UtensilsCrossed } from "lucide-react";
import { cn } from "@/lib/utils";

export type FoodItemCardData = {
  id: number;
  restaurantId: number;
  restaurantName: string;
  name: string;
  price: number;
  image?: string | null;
  description?: string | null;
  categoryName?: string | null;
  isVeg?: boolean;
};

type FoodItemCardProps = {
  item: FoodItemCardData;
  asLink?: boolean;
};

export function FoodItemCard({ item, asLink = true }: FoodItemCardProps) {
  const content = (
    <div className="flex gap-4 p-4">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          {item.categoryName ? (
            <p className="text-xs font-semibold uppercase tracking-wide text-orange-600">{item.categoryName}</p>
          ) : (
            <p className="text-xs font-semibold uppercase tracking-wide text-orange-600">Food</p>
          )}
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-bold",
              item.isVeg !== false ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
            )}
          >
            {item.isVeg !== false ? "Veg" : "Non-veg"}
          </span>
        </div>
        <h3 className="mt-1 truncate text-lg font-bold text-gray-900">{item.name}</h3>
        <p className="mt-1 truncate text-sm text-gray-500">{item.restaurantName}</p>
        <p className="mt-2 line-clamp-2 text-sm text-gray-600">{item.description || "No description available"}</p>
        <p className="mt-3 text-base font-semibold text-orange-600">₹{item.price}</p>
      </div>

      <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-xl border border-orange-100 bg-orange-50">
        {item.image ? (
          <Image
            src={item.image}
            alt={item.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            sizes="96px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-orange-300">
            <UtensilsCrossed className="h-6 w-6" />
          </div>
        )}
      </div>
    </div>
  );

  if (!asLink) {
    return <div className="rounded-2xl border border-orange-100 bg-white">{content}</div>;
  }

  return (
    <Link
      href={`/search/${item.restaurantId}`}
      className="group overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-sm transition hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
    >
      {content}
    </Link>
  );
}

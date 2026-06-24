"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { foodCategories } from "@/lib/foods";
import { useUser } from "@clerk/nextjs";
import { SectionHeader } from "./ui/SectionHeader";

export default function Categories() {
  const router = useRouter();
  const user = useUser();

  const handleCategoryClick = (categoryName: string) => {
    router.push(`/search?query=${encodeURIComponent(categoryName)}`);
  };

  const title = user.user?.firstName
    ? `${user.user.firstName}, what's on your mind?`
    : "What's on your mind?";

  return (
    <section className="bg-slate-950 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          dark
          label="Trending categories"
          title={title}
          description="Tap a cuisine to explore restaurants and dishes."
          className="mb-8"
        />

        <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] md:hidden [&::-webkit-scrollbar]:hidden">
          {foodCategories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => handleCategoryClick(category.name)}
              className="group flex w-24 shrink-0 snap-start flex-col items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
            >
              <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-slate-800 transition group-hover:ring-2 group-hover:ring-orange-400">
                <Image
                  src={category.image}
                  alt={category.name}
                  width={120}
                  height={120}
                  className="object-contain p-1 transition-transform duration-300 group-hover:scale-110"
                />
              </div>
              <p className="mt-2 text-center text-xs font-semibold leading-tight text-white group-hover:text-orange-400">
                {category.name}
              </p>
            </button>
          ))}
        </div>

        <div className="hidden gap-4 md:grid md:grid-cols-5 lg:grid-cols-10">
          {foodCategories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => handleCategoryClick(category.name)}
              className="group flex flex-col items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
            >
              <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-slate-800 transition group-hover:shadow-lg group-hover:ring-2 group-hover:ring-orange-400">
                <Image
                  src={category.image}
                  alt={category.name}
                  width={300}
                  height={300}
                  className="object-contain p-1 transition-transform duration-300 group-hover:scale-110"
                />
              </div>
              <p className="mt-2 text-center text-sm font-semibold text-white transition group-hover:text-orange-400">
                {category.name}
              </p>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { foodCategories } from "@/lib/foods";
import { useUser } from "@clerk/nextjs";

export default function Categories() {
  const router = useRouter();
  const user = useUser();

  const handleCategoryClick = (categoryName: string) => {
    router.push(`/search?query=${encodeURIComponent(categoryName)}`);
  };

  return (
    <div className="bg-black">
      {/* Categories Grid Section */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <h2 className="text-2xl font-bold mb-8 text-white">
          {user.user?.firstName && `${user.user.firstName} `}What&apos;s on your mind?
        </h2>

        {/* Grid Container - All 20 categories visible in 2 rows */}
        <div className="gap-6" style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)' }}>
          {foodCategories.map((category) => (
            <div
              key={category.id}
              onClick={() => handleCategoryClick(category.name)}
              className="flex flex-col items-center cursor-pointer group"
            >
              {/* Category Image */}
              <div className="w-full aspect-square bg-gray-200 rounded-2xl overflow-hidden mb-3 group-hover:shadow-2xl transition-all duration-300 relative flex items-center justify-center">
                <Image
                  src={category.image}
                  alt={category.name}
                  width={300}
                  height={300}
                  className="object-contain group-hover:scale-125 transition-transform duration-300"
                  quality={90}
                />
              </div>

              {/* Category Name */}
              <p className="text-center text-sm font-semibold text-white group-hover:text-orange-600 transition leading-tight">
                {category.name}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const SearchBar = () => {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const handleSearch = () => {
    if (!search.trim()) return;

    router.push(`/search?query=${encodeURIComponent(search)}`);
  };

  return (
    <div className="flex gap-2 w-full max-w-md">
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        placeholder="Search dishes or restaurants..."
        className="flex-1 rounded-lg bg-white outline-none placeholder:text-gray-400 placeholder:font-semibold text-black font-semibold"
      />
      <span
        onClick={handleSearch}
        className="cursor-pointer flex items-center justify-center bg-orange-500 hover:bg-orange-600 text-white rounded-lg p-2 transition-colors duration-200"
        tabIndex={0}
        role="button"
        aria-label="Search"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z"
          />
        </svg>
      </span>
    </div>
  );
};

export default SearchBar;
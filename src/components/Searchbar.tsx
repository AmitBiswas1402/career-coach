"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";

const SearchBar = () => {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const handleSearch = () => {
    if (!search.trim()) return;
    router.push(`/search?query=${encodeURIComponent(search)}`);
  };

  return (
    <div className="flex w-full gap-2">
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        placeholder="Search dishes or restaurants..."
        className="flex-1 bg-transparent text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400 focus-visible:ring-0"
        aria-label="Search dishes or restaurants"
      />
      <button
        type="button"
        onClick={handleSearch}
        aria-label="Search"
        className="flex shrink-0 items-center justify-center rounded-xl bg-orange-500 p-2.5 text-white transition hover:bg-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
      >
        <Search className="h-5 w-5" />
      </button>
    </div>
  );
};

export default SearchBar;

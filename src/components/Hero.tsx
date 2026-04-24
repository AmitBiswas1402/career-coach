"use client";

import { MapPin, ChevronDown } from "lucide-react";
import SearchBar from "./Searchbar";

const Hero = () => {
  return (
    <section className="min-h-[30vh] flex flex-col items-center justify-center px-6 py-16">
      {/* Main heading */}
      <div className="text-center mb-12 max-w-4xl">
      <h1 className="text-7xl md:text-6xl font-extrabold text-white mb-8 leading-tight">
        Order food 
      </h1>
      </div>

      {/* Search section */}
      <div className="flex flex-col md:flex-row gap-4 w-full max-w-3xl mb-16">
      {/* Location selector */}
      <div className="flex items-center gap-2 bg-white rounded-lg px-6 py-4 flex-1 cursor-pointer hover:shadow-lg transition-shadow">
        <MapPin className="h-5 w-5 text-orange-500 shrink-0" />
        <input
        type="text"
        placeholder="Enter your delivery location"
        className="bg-transparent text-gray-700 text-sm placeholder-gray-500 outline-none w-full"
        />
        <ChevronDown className="h-4 w-4 text-gray-700 shrink-0" />
      </div>

      {/* Search bar */}
      <div className="flex items-center gap-2 bg-white rounded-lg px-6 py-4 flex-1 md:flex-2 cursor-pointer hover:shadow-lg transition-shadow">
        <SearchBar />
      </div>
      </div>
    </section>
  );
};

export default Hero;

"use client";

import { MapPin, ChevronDown } from "lucide-react";
import SearchBar from "./Searchbar";

const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-linear-to-br from-orange-600 via-orange-500 to-amber-500 px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative mx-auto max-w-4xl text-center">
        <p className="text-xs font-bold uppercase tracking-[0.35em] text-orange-100">Food delivery made simple</p>
        <h1 className="mt-4 text-4xl font-black leading-tight text-white sm:text-5xl lg:text-6xl">
          Order food
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base text-orange-50 sm:text-lg">
          Discover restaurants and dishes near you — search, browse, and add to cart in seconds.
        </p>

        <div className="mx-auto mt-10 max-w-3xl rounded-2xl bg-white p-4 shadow-xl sm:p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-surface-cream px-4 py-3">
              <MapPin className="h-5 w-5 shrink-0 text-orange-500" />
              <input
                type="text"
                placeholder="Enter your delivery location"
                className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400 focus-visible:ring-0"
                aria-label="Delivery location"
              />
              <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
            </div>
            <div className="flex flex-1 items-center rounded-xl border border-slate-200 bg-surface-cream px-2 py-2 md:py-1">
              <SearchBar />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;

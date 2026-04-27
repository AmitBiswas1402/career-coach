"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setCurrentUserRole } from "@/actions/user.action";

export default function RoleSelectPage() {
  const router = useRouter();
  const [loadingRole, setLoadingRole] = useState<"customer" | "restaurant_owner" | null>(null);
  const [error, setError] = useState("");

  const handleSelect = async (role: "customer" | "restaurant_owner") => {
    try {
      setError("");
      setLoadingRole(role);
      await setCurrentUserRole(role);

      router.push("/");
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not set role";
      setError(message);
    } finally {
      setLoadingRole(null);
    }
  };

  return (
    <main className="min-h-screen bg-linear-to-br from-black via-gray-900 to-black px-4 py-16 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-orange-400">Welcome</p>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">Choose your role</h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-gray-300 sm:text-base">
            Customer can browse and purchase food. Owner can add, update, and delete menu items from the owner dashboard.
          </p>
        </div>

        {error ? (
          <div className="mb-6 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        <div className="grid gap-6 md:grid-cols-2">
          <button
            onClick={() => handleSelect("customer")}
            disabled={loadingRole !== null}
            className="rounded-3xl border border-orange-400/30 bg-white/5 p-8 text-left shadow-sm backdrop-blur transition hover:-translate-y-1 hover:bg-white/10 disabled:opacity-70"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-300">Customer</p>
            <h2 className="mt-4 text-2xl font-bold">Browse and order food</h2>
            <p className="mt-3 text-sm text-gray-300">Search restaurants, add dishes to cart, and place orders like normal users.</p>
            <p className="mt-5 text-sm font-semibold text-orange-300">
              {loadingRole === "customer" ? "Setting role..." : "Continue as customer →"}
            </p>
          </button>

          <button
            onClick={() => handleSelect("restaurant_owner")}
            disabled={loadingRole !== null}
            className="rounded-3xl border border-orange-400/30 bg-orange-500/10 p-8 text-left shadow-sm backdrop-blur transition hover:-translate-y-1 hover:bg-orange-500/20 disabled:opacity-70"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-200">Owner</p>
            <h2 className="mt-4 text-2xl font-bold">Manage your menu</h2>
            <p className="mt-3 text-sm text-gray-200">Add, edit, and delete food items from your owner dashboard.</p>
            <p className="mt-5 text-sm font-semibold text-orange-200">
              {loadingRole === "restaurant_owner" ? "Setting role..." : "Continue as owner →"}
            </p>
          </button>
        </div>
      </div>
    </main>
  );
}

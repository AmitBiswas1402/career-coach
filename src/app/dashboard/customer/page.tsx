import Link from "next/link";

export default function CustomerDashboardPage() {
  return (
    <main className="min-h-screen bg-linear-to-br from-black via-gray-900 to-black px-4 py-12 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-orange-400">Dashboard</p>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">Customer Dashboard</h1>
        <p className="mt-4 max-w-2xl text-sm text-gray-300 sm:text-base">
          You are logged in as a customer. Browse restaurants, search dishes, and place your orders from here.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/"
            className="rounded-full border border-orange-400/40 px-5 py-2 text-sm font-semibold text-orange-200 hover:bg-orange-500/10"
          >
            Go to Home
          </Link>
          <Link
            href="/search"
            className="rounded-full border border-white/20 px-5 py-2 text-sm font-semibold text-white hover:bg-white/10"
          >
            Explore Restaurants
          </Link>
        </div>
      </div>
    </main>
  );
}

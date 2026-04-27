import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <main className="min-h-screen bg-black px-4 py-16 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl rounded-3xl border border-white/15 bg-white/5 p-8 text-center backdrop-blur sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-orange-300">Access denied</p>
        <h1 className="mt-4 text-4xl font-extrabold tracking-tight">Unauthorized</h1>
        <p className="mt-4 text-sm text-gray-300 sm:text-base">
          This page is only available for restaurant owners.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/role-select"
            className="rounded-xl bg-orange-600 px-5 py-3 text-sm font-semibold text-white hover:bg-orange-700"
          >
            Choose role
          </Link>
          <Link
            href="/"
            className="rounded-xl border border-white/20 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
          >
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}

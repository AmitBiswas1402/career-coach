import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-orange-100 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div>
          <p className="text-xl font-extrabold text-slate-900">
            Food<span className="text-orange-500">.</span>
          </p>
          <p className="mt-1 text-sm text-slate-500">Order food delivered to your door.</p>
        </div>
        <nav className="flex flex-wrap gap-4 text-sm font-medium text-slate-600">
          <Link href="/" className="transition hover:text-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300">
            Home
          </Link>
          <Link href="/search" className="transition hover:text-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300">
            Search
          </Link>
          <Link href="/role-select" className="transition hover:text-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300">
            Choose role
          </Link>
        </nav>
        <p className="text-sm text-slate-400">© {new Date().getFullYear()} Food. All rights reserved.</p>
      </div>
    </footer>
  );
}

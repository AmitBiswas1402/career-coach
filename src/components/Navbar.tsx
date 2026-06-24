import Link from "next/link";
import Users from "./Users";

const Navbar = () => {
  return (
    <header className="sticky top-0 z-40 border-b border-orange-100 bg-surface-cream/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="group shrink-0">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Food
            <span className="ml-0.5 text-orange-500 transition group-hover:text-orange-600">.</span>
          </h1>
        </Link>

        <nav className="ml-auto flex items-center gap-3 sm:gap-4">
          <Link
            href="/search"
            className="hidden rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-orange-300 hover:text-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 sm:inline-flex"
          >
            Explore
          </Link>
          <Users />
        </nav>
      </div>
    </header>
  );
};

export default Navbar;

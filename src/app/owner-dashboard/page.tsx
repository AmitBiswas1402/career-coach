import { getOwnerDashboardData } from "@/actions/owner.action";
import OwnerDashboardClient from "./client";
import Link from "next/link";
import { ShieldAlert, ChefHat, Home, UserCog } from "lucide-react";

export default async function OwnerDashboardPage() {
  try {
    const data = await getOwnerDashboardData();
    return <OwnerDashboardClient initialData={data} />;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load dashboard";

    const isUnauthorized = message === "Unauthorized";
    const isNotOwner = message === "Only owners can perform this action";

    const title = isUnauthorized
      ? "Sign in to continue"
      : isNotOwner
      ? "Owner access only"
      : "Something went wrong";

    const description = isUnauthorized
      ? "You need to sign in before accessing the owner dashboard and managing your restaurant."
      : isNotOwner
      ? "Your account is not registered as a restaurant owner. Select the owner role to get started."
      : "We couldn't load the dashboard right now. Please try refreshing or come back shortly.";

    return (
      <main className="relative min-h-screen overflow-hidden bg-[#fffaf5]">
        {/* Subtle radial glows matching GourmetGo palette */}
        {/* <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 70% -10%, rgba(251,146,60,0.13) 0%, transparent 70%), radial-gradient(ellipse 45% 40% at 0% 100%, rgba(249,115,22,0.09) 0%, transparent 65%)",
          }}
        /> */}

        {/* Dot-grid texture */}
        {/* <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "radial-gradient(circle, #f97316 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        /> */}

        {/* Nav bar — mirrors GourmetGo header feel */}
        {/* <nav className="relative z-10 border-b border-orange-100/80 bg-white/70 backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-linear-to-br from-orange-500 to-amber-500 shadow-md shadow-orange-200">
                <ChefHat className="h-4 w-4 text-white" />
              </div>
              <span className="text-[15px] font-black tracking-tight text-slate-900">
                Gourmet<span className="text-orange-500">Go</span>
              </span>
            </div>
            <span className="hidden rounded-full border border-orange-200 bg-orange-50 px-3.5 py-1 text-[11px] font-bold uppercase tracking-widest text-orange-600 sm:inline-flex">
              Owner Dashboard
            </span>
          </div>
        </nav> */}

        {/* Main content */}
        <div className="relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center justify-center px-6 py-20">
          <div className="w-full max-w-2xl">

            {/* Card */}
            <div className="overflow-hidden rounded-[2rem] border border-orange-100 bg-white shadow-[0_24px_80px_rgba(0,0,0,0.07),0_4px_12px_rgba(0,0,0,0.04)]">

              {/* Card top stripe */}
              <div className="h-1.5 w-full bg-linear-to-r from-orange-500 via-amber-400 to-orange-500" />

              <div className="p-8 sm:p-12">
                {/* Icon badge */}
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-orange-500 to-amber-500 shadow-lg shadow-orange-200">
                  <ShieldAlert className="h-7 w-7 text-white" />
                </div>

                {/* Tag */}
                <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.3em] text-orange-500">
                  Access required
                </p>

                {/* Heading */}
                <h1 className="mt-2 text-3xl font-black leading-tight tracking-tight text-slate-900 sm:text-4xl">
                  {title}
                </h1>

                {/* Description */}
                <p className="mt-4 max-w-md text-[15px] leading-7 text-slate-500">
                  {description}
                </p>

                {/* Divider */}
                <div className="my-8 border-t border-slate-100" />

                {/* Help note */}
                <div className="flex items-start gap-3 rounded-2xl border border-orange-100 bg-orange-50/60 px-5 py-4">
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-100">
                    <span className="text-[11px] font-black text-orange-600">i</span>
                  </div>
                  <p className="text-sm leading-6 text-slate-600">
                    {isUnauthorized
                      ? "Use the role-select page to sign in as an owner and unlock restaurant management tools."
                      : isNotOwner
                      ? "Restaurant owners get access to full menu management, analytics, and multi-location tools."
                      : "If this issue persists, please contact support or try clearing your browser cache."}
                  </p>
                </div>

                {/* CTA buttons */}
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link
                    href="/role-select"
                    className="inline-flex items-center gap-2 rounded-2xl bg-linear-to-r from-orange-500 to-amber-500 px-6 py-3.5 text-sm font-bold text-white shadow-md shadow-orange-200 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-orange-200 active:translate-y-0"
                  >
                    <UserCog className="h-4 w-4" />
                    Choose Role
                  </Link>

                  <Link
                    href="/"
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-md active:translate-y-0"
                  >
                    <Home className="h-4 w-4" />
                    Go Home
                  </Link>
                </div>
              </div>
            </div>

            {/* Footer caption */}
            <p className="mt-8 text-center text-[13px] text-slate-400">
              © {new Date().getFullYear()} Food · Owner Dashboard
            </p>
          </div>
        </div>
      </main>
    );
  }
}
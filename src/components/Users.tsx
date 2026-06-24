"use client";

import Link from "next/link";
import { Button } from "./ui/button";
import { useAuth, useClerk, useUser, UserButton } from "@clerk/nextjs";

const Users = () => {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const { openSignIn } = useClerk();
  const role = user?.publicMetadata?.role as string | undefined;

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      {isSignedIn ? (
        <>
          {role === "restaurant_owner" ? (
            <Link
              href="/owner-dashboard"
              className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-700 transition hover:bg-orange-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 sm:px-4 sm:py-2 sm:text-sm"
            >
              Admin
            </Link>
          ) : null}
          <UserButton />
        </>
      ) : (
        <Button variant="default" size="sm" onClick={() => openSignIn()} className="btn-primary border-0">
          Sign In
        </Button>
      )}
    </div>
  );
};

export default Users;

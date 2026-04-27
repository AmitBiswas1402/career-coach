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
    <div className="hidden md:flex items-center space-x-4">
      {isSignedIn ? (
        <>
          {role === "restaurant_owner" ? (
            <Link
              href="/dashboard/owner"
              className="rounded-full border border-orange-400/30 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-500/10 hover:text-orange-300"
            >
              Dashboard
            </Link>
          ) : null}
          <UserButton />
        </>
      ) : (
        <Button variant="default" onClick={() => openSignIn()}>
          Sign In
        </Button>
      )}
    </div>
  );
};
export default Users;

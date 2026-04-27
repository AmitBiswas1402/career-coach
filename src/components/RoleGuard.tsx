"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

export function RoleGuard() {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Only check if signed in and not already on role-select page
    if (isSignedIn && pathname !== "/role-select") {
      const roleSelected = user?.publicMetadata?.roleSelected as boolean | undefined;

      // If user hasn't selected a role yet, redirect to role selection
      if (roleSelected === false) {
        router.push("/role-select");
      }
    }
  }, [isSignedIn, user?.publicMetadata?.roleSelected, pathname, router]);

  return null;
}

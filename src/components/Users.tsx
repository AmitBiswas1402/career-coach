"use client";

import { Button } from "./ui/button";
import { SignInButton, useAuth, UserButton } from "@clerk/nextjs";

const Users = () => {
  const { isSignedIn } = useAuth();

  return (
    <div className="hidden md:flex items-center space-x-4">
      {isSignedIn ? (
        <UserButton />
      ) : (
        <SignInButton mode="modal">
          <Button variant="default">Sign In</Button>
        </SignInButton>
      )}
    </div>
  );
};
export default Users;

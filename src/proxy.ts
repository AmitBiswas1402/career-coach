import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isRoleSelectRoute = createRouteMatcher(["/role-select(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth();
  const roleCompletionCookie = req.cookies.get("role-selection-complete")?.value === "1";

  // If not signed in, allow request
  if (!userId) {
    return NextResponse.next();
  }

  const publicMetadata =
    (sessionClaims?.publicMetadata as Record<string, unknown>) ?? {};

  const role = publicMetadata.role as string | undefined;
  const roleSelected = publicMetadata.roleSelected as boolean | undefined;

  // User has NOT selected a role yet
  const hasSelectedRole = roleCompletionCookie || roleSelected === true || Boolean(role);
  const needsRoleSelection = roleSelected === false && !roleCompletionCookie;

  // Redirect new users to role selection page
  if (needsRoleSelection && !isRoleSelectRoute(req)) {
    return NextResponse.redirect(new URL("/role-select", req.url));
  }

  // Prevent users from revisiting role select page
  if (!needsRoleSelection && isRoleSelectRoute(req)) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
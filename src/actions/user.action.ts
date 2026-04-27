"use server";

import { db } from "@/db";
import { usersTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";
import { cookies } from "next/headers";

export type AppUserRole = "customer" | "restaurant_owner";

export async function syncUser() {
  const { userId } = await auth();

  if (!userId) return null;

  const user = await currentUser();

  if (!user) return null;

  const email = user.emailAddresses[0].emailAddress;

  // check if user exists
  const existing = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email))
    .limit(1);

  const client = await clerkClient();

  if (existing.length) {
    await client.users.updateUser(userId, {
      publicMetadata: {
        role: existing[0].role,
        roleSelected: true,
      },
    });

    return existing[0];
  }

  await client.users.updateUser(userId, {
    publicMetadata: {
      roleSelected: false,
    },
  });

  // create user with default role
  const [created] = await db
    .insert(usersTable)
    .values({
      name: `${user.firstName ?? ""} ${user.lastName ?? ""}`,
      email,
      role: "customer", // default role
    })
    .returning();

  return created;
}

export async function getUserByEmail(email: string) {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email))
    .limit(1);

  return user ?? null;
}

export async function getCurrentUser() {
  const { userId } = await auth();

  if (!userId) return null;

  const user = await currentUser();

  if (!user) return null;

  const email = user.emailAddresses[0].emailAddress;

  const dbUser = await getUserByEmail(email);

  return dbUser;
}

export async function getDbUserId() {
  const user = await getCurrentUser();

  if (!user) throw new Error("User not found");

  return user.id; // integer (from usersTable)
}

export async function getClerkUserId() {
  const { userId } = await auth();

  if (!userId) throw new Error("Unauthorized");

  return userId; // string → used in cartsTable.userId
}

export async function setCurrentUserRole(role: AppUserRole) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const user = await currentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const email = user.emailAddresses[0].emailAddress;

  const existing = await getUserByEmail(email);

  if (existing) {
    await db
      .update(usersTable)
      .set({ role })
      .where(eq(usersTable.id, existing.id));
  } else {
    await db.insert(usersTable).values({
      name: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim(),
      email,
      role,
    });
  }

  const client = await clerkClient();
  await client.users.updateUser(userId, {
    publicMetadata: {
      role,
      roleSelected: true,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set("role-selection-complete", "1", {
    maxAge: 120,
    path: "/",
    sameSite: "lax",
  });

  return { success: true, role };
}
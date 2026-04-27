"use server";

import { db } from "@/db";
import { usersTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth, currentUser } from "@clerk/nextjs/server";

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

  if (existing.length) return existing[0];

  // create user
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
"use server"

import { db } from "@/lib/prisma";

export async function getOrCreateUser(clerkUserId: string, email: string) {
  const existingUser = await db.user.findUnique({
    where: { clerkUserId },
  });

  if (existingUser) return existingUser;

  // Fallback: find by email first
  const userByEmail = await db.user.findUnique({
    where: { email },
  });

  // If user exists by email, attach clerkUserId to it
  if (userByEmail) {
    return await db.user.update({
      where: { email },
      data: { clerkUserId },
    });
  }

  // Else create new user
  return await db.user.create({
    data: {
      clerkUserId,
      email,
    },
  });
}

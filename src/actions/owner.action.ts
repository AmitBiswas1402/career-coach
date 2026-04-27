"use server";

import { revalidatePath } from "next/cache";
import { auth, currentUser } from "@clerk/nextjs/server";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { menuItemsTable, restaurantsTable, usersTable } from "@/db/schema";

async function getOwnerDbUser() {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId || !user) {
    throw new Error("Unauthorized");
  }

  const email = user.emailAddresses[0].emailAddress;

  const [dbUser] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email))
    .limit(1);

  if (!dbUser || dbUser.role !== "restaurant_owner") {
    throw new Error("Only owners can perform this action");
  }

  return dbUser;
}

export async function getOwnerDashboardData() {
  const owner = await getOwnerDbUser();

  const ownerRestaurants = await db
    .select()
    .from(restaurantsTable)
    .where(eq(restaurantsTable.ownerId, owner.id));

  if (ownerRestaurants.length === 0) {
    return {
      owner,
      restaurants: [],
      menuItemsByRestaurant: {} as Record<number, typeof menuItemsTable.$inferSelect[]>,
    };
  }

  const restaurantIds = ownerRestaurants.map((r) => r.id);
  const items = await db
    .select()
    .from(menuItemsTable)
    .where(inArray(menuItemsTable.restaurantId, restaurantIds));

  const menuItemsByRestaurant = items.reduce<Record<number, typeof items>>((acc, item) => {
    if (!acc[item.restaurantId]) {
      acc[item.restaurantId] = [];
    }
    acc[item.restaurantId].push(item);
    return acc;
  }, {});

  return {
    owner,
    restaurants: ownerRestaurants,
    menuItemsByRestaurant,
  };
}

export async function createRestaurantAction(formData: FormData) {
  const owner = await getOwnerDbUser();

  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "both") as "veg" | "non-veg" | "both";

  if (!name) {
    throw new Error("Restaurant name is required");
  }

  await db.insert(restaurantsTable).values({
    name,
    type,
    rating: "4.5",
    ownerId: owner.id,
  });

  revalidatePath("/dashboard/owner");
}

export async function addMenuItemAction(formData: FormData) {
  await getOwnerDbUser();

  const restaurantId = Number(formData.get("restaurantId"));
  const name = String(formData.get("name") ?? "").trim();
  const price = Number(formData.get("price"));

  if (!restaurantId || !name || !Number.isFinite(price) || price <= 0) {
    throw new Error("Invalid item details");
  }

  await db.insert(menuItemsTable).values({
    restaurantId,
    name,
    price,
  });

  revalidatePath("/dashboard/owner");
}

export async function updateMenuItemAction(formData: FormData) {
  const owner = await getOwnerDbUser();

  const itemId = Number(formData.get("itemId"));
  const name = String(formData.get("name") ?? "").trim();
  const price = Number(formData.get("price"));

  if (!itemId || !name || !Number.isFinite(price) || price <= 0) {
    throw new Error("Invalid item details");
  }

  const [item] = await db
    .select({ id: menuItemsTable.id, restaurantId: menuItemsTable.restaurantId })
    .from(menuItemsTable)
    .where(eq(menuItemsTable.id, itemId))
    .limit(1);

  if (!item) {
    throw new Error("Food item not found");
  }

  const [restaurant] = await db
    .select({ id: restaurantsTable.id })
    .from(restaurantsTable)
    .where(and(eq(restaurantsTable.id, item.restaurantId), eq(restaurantsTable.ownerId, owner.id)))
    .limit(1);

  if (!restaurant) {
    throw new Error("You cannot update this item");
  }

  await db
    .update(menuItemsTable)
    .set({ name, price })
    .where(eq(menuItemsTable.id, itemId));

  revalidatePath("/dashboard/owner");
}

export async function deleteMenuItemAction(formData: FormData) {
  const owner = await getOwnerDbUser();

  const itemId = Number(formData.get("itemId"));

  if (!itemId) {
    throw new Error("Invalid item id");
  }

  const [item] = await db
    .select({ id: menuItemsTable.id, restaurantId: menuItemsTable.restaurantId })
    .from(menuItemsTable)
    .where(eq(menuItemsTable.id, itemId))
    .limit(1);

  if (!item) {
    throw new Error("Food item not found");
  }

  const [restaurant] = await db
    .select({ id: restaurantsTable.id })
    .from(restaurantsTable)
    .where(and(eq(restaurantsTable.id, item.restaurantId), eq(restaurantsTable.ownerId, owner.id)))
    .limit(1);

  if (!restaurant) {
    throw new Error("You cannot delete this item");
  }

  await db.delete(menuItemsTable).where(eq(menuItemsTable.id, itemId));

  revalidatePath("/dashboard/owner");
}

"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  categoriesTable,
  menuItemsTable,
  restaurantsTable,
  usersTable,
  restaurantCategoriesTable,
} from "@/db/schema";
import { seedCategories } from "@/db/seed";

async function getOwnerDbUser() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const user = await currentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const email = user.emailAddresses[0].emailAddress;

  const [dbUser] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email))
    .limit(1);

  const clerkRole = user.publicMetadata?.role as string | undefined;

  if (clerkRole !== "restaurant_owner") {
    throw new Error("Only owners can perform this action");
  }

  if (!dbUser) {
    throw new Error("Owner account not found");
  }

  if (dbUser.role !== "restaurant_owner") {
    await db
      .update(usersTable)
      .set({ role: "restaurant_owner" })
      .where(eq(usersTable.id, dbUser.id));

    return { ...dbUser, role: "restaurant_owner" };
  }

  return dbUser;
}

export async function getOwnerDashboardData() {
  const owner = await getOwnerDbUser();
  await seedCategories();

  const categories = await db
    .select({ id: categoriesTable.id, name: categoriesTable.name })
    .from(categoriesTable);

  try {
    const restaurantRows = await db
      .select({
        id: restaurantsTable.id,
        name: restaurantsTable.name,
        address: restaurantsTable.address,
        image: restaurantsTable.image,
        type: restaurantsTable.type,
        rating: restaurantsTable.rating,
        published: restaurantsTable.published,
        ownerId: restaurantsTable.ownerId,
      })
      .from(restaurantsTable)
      .where(eq(restaurantsTable.ownerId, Number(owner.id)));

    const restaurantIds = restaurantRows.map((r) => r.id);

    const categoriesByRestaurant: Record<number, { id: number; name: string }[]> = {};
    if (restaurantIds.length > 0) {
      const categoryRows = await db
        .select({
          restaurantId: restaurantCategoriesTable.restaurantId,
          categoryId: categoriesTable.id,
          categoryName: categoriesTable.name,
        })
        .from(restaurantCategoriesTable)
        .innerJoin(categoriesTable, eq(categoriesTable.id, restaurantCategoriesTable.categoryId))
        .where(inArray(restaurantCategoriesTable.restaurantId, restaurantIds));

      for (const row of categoryRows) {
        if (!categoriesByRestaurant[row.restaurantId]) {
          categoriesByRestaurant[row.restaurantId] = [];
        }
        categoriesByRestaurant[row.restaurantId].push({ id: row.categoryId, name: row.categoryName });
      }
    }

    const ownerRestaurants = restaurantRows.map((r) => ({
      ...r,
      categories: categoriesByRestaurant[r.id] ?? [],
    }));

    type DashboardMenuItem = {
      id: number;
      restaurantId: number;
      name: string;
      price: number;
      image: string | null;
      description: string | null;
      categoryId: number | null;
      categoryName: string | null;
      isVeg: boolean | null;
    };

    let items: DashboardMenuItem[] = [];

    if (restaurantIds.length > 0) {
      const menuRows = await db
        .select({
          id: menuItemsTable.id,
          restaurantId: menuItemsTable.restaurantId,
          name: menuItemsTable.name,
          price: menuItemsTable.price,
          image: menuItemsTable.image,
          description: menuItemsTable.description,
          categoryId: menuItemsTable.categoryId,
          categoryName: categoriesTable.name,
          isVeg: menuItemsTable.isVeg,
        })
        .from(menuItemsTable)
        .leftJoin(categoriesTable, eq(categoriesTable.id, menuItemsTable.categoryId))
        .where(inArray(menuItemsTable.restaurantId, restaurantIds));

      items = menuRows.map((row) => ({
        id: row.id,
        restaurantId: row.restaurantId,
        name: row.name,
        price: Number(row.price) / 100,
        image: row.image,
        description: row.description,
        categoryId: row.categoryId,
        categoryName: row.categoryName,
        isVeg: row.isVeg,
      }));
    }

    const menuItemsByRestaurant = items.reduce<Record<number, DashboardMenuItem[]>>((acc, item) => {
      if (!acc[item.restaurantId]) {
        acc[item.restaurantId] = [];
      }
      acc[item.restaurantId].push(item);
      return acc;
    }, {});

    return {
      owner,
      categories,
      restaurants: ownerRestaurants,
      menuItemsByRestaurant,
    };
  } catch (error) {
    console.error("Owner dashboard query failed:", error);
    return {
      owner,
      categories,
      restaurants: [],
      menuItemsByRestaurant: {} as Record<
        number,
        {
          id: number;
          restaurantId: number;
          name: string;
          price: number;
          image: string | null;
          description: string | null;
          categoryId: number | null;
          categoryName: string | null;
          isVeg: boolean | null;
        }[]
      >,
    };
  }
}

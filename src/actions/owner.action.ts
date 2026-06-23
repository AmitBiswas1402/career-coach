"use server";

import { revalidatePath } from "next/cache";
import { auth, currentUser } from "@clerk/nextjs/server";
import { and, eq, inArray } from "drizzle-orm";
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

export async function createRestaurantAction(formData: FormData) {
  const owner = await getOwnerDbUser();

  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "both") as "veg" | "non-veg" | "both";
  const address = String(formData.get("address") ?? "").trim() || null;
  const image = String(formData.get("image") ?? null) || null;
  const rating = String(formData.get("rating") ?? "4.5");
  const categoriesRaw = formData.get("categories");
  let categories: number[] = [];
  if (categoriesRaw) {
    try {
      if (typeof categoriesRaw === "string") {
        categories = JSON.parse(categoriesRaw);
      } else {
        categories = Array.isArray(categoriesRaw) ? (categoriesRaw as any[]).map((c) => Number(c)) : [];
      }
    } catch {
      // ignore parse errors
    }
  }

  if (!name) {
    throw new Error("Restaurant name is required");
  }

  // Try full insert; fall back to minimal insert if DB missing columns
  try {
    const [restaurant] = await db.insert(restaurantsTable).values({
      name,
      address,
      image,
      type,
      rating,
      ownerId: Number(owner.id),
      published: true,
    }).returning({ id: restaurantsTable.id });

    if (restaurant && categories.length > 0) {
      const values = categories.filter((c) => Number.isFinite(c)).map((catId) => ({ restaurantId: restaurant.id, categoryId: Number(catId) }));
      if (values.length > 0) {
        try {
          await db.insert(restaurantCategoriesTable).values(values as any[]);
        } catch (catErr) {
          console.error("Failed to insert restaurant categories:", catErr);
        }
      }
    }
  } catch (err: any) {
    console.error("createRestaurantAction full insert failed:", err);
    // fallback minimal insert
    const [row] = await db.insert(restaurantsTable).values({ name, type, rating, ownerId: Number(owner.id) }).returning({ id: restaurantsTable.id });
    const insertedId = row?.id;
    if (insertedId && categories.length > 0) {
      const values = categories.filter((c) => Number.isFinite(c)).map((catId) => ({ restaurantId: insertedId, categoryId: Number(catId) }));
      if (values.length > 0) {
        try {
          await db.insert(restaurantCategoriesTable).values(values as any[]);
        } catch (catErr) {
          console.error("Failed to link categories on fallback insert:", catErr);
        }
      }
    }
  }

  revalidatePath("/owner-dashboard");
}

export async function addMenuItemAction(formData: FormData) {
  const owner = await getOwnerDbUser();

  const restaurantId = Number(formData.get("restaurantId"));
  const name = String(formData.get("name") ?? "").trim();
  const price = Number(formData.get("price"));
  const description = String(formData.get("description") ?? "").trim();
  const categoryId = Number(formData.get("categoryId")) || null;
  const isVeg = String(formData.get("isVeg")) === "true";
  const image = String(formData.get("image") ?? null) || null;

  if (!restaurantId || !name || !Number.isFinite(price) || price <= 0) {
    throw new Error("Invalid item details");
  }

  // Verify restaurant ownership
  const [restaurant] = await db
    .select({ id: restaurantsTable.id, ownerId: restaurantsTable.ownerId })
    .from(restaurantsTable)
    .where(eq(restaurantsTable.id, restaurantId))
    .limit(1);

  if (!restaurant || restaurant.ownerId !== Number(owner.id)) {
    throw new Error("You cannot add items to this restaurant");
  }

  await db.insert(menuItemsTable).values({
    restaurantId,
    name,
    price,
    image,
    description: description || null,
    categoryId,
    isVeg,
  });

  revalidatePath("/owner-dashboard");
}

export async function updateMenuItemAction(formData: FormData) {
  const owner = await getOwnerDbUser();

  const itemId = Number(formData.get("itemId"));
  const name = String(formData.get("name") ?? "").trim();
  const price = Number(formData.get("price"));
  const description = String(formData.get("description") ?? "").trim();
  const categoryId = Number(formData.get("categoryId")) || null;
  const isVeg = String(formData.get("isVeg")) === "true";

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
    .where(and(eq(restaurantsTable.id, item.restaurantId), eq(restaurantsTable.ownerId, Number(owner.id))))
    .limit(1);

  if (!restaurant) {
    throw new Error("You cannot update this item");
  }

  await db
    .update(menuItemsTable)
    .set({ 
      name, 
      price,
      description: description || null,
      categoryId,
      isVeg,
    })
    .where(eq(menuItemsTable.id, itemId));

  revalidatePath("/owner-dashboard");
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
    .where(and(eq(restaurantsTable.id, item.restaurantId), eq(restaurantsTable.ownerId, Number(owner.id))))
    .limit(1);

  if (!restaurant) {
    throw new Error("You cannot delete this item");
  }

  await db.delete(menuItemsTable).where(eq(menuItemsTable.id, itemId));

  revalidatePath("/owner-dashboard");
}

export async function getRestaurantMenuItems(restaurantId: number) {
  const owner = await getOwnerDbUser();

  const [restaurant] = await db
    .select({ id: restaurantsTable.id })
    .from(restaurantsTable)
    .where(and(eq(restaurantsTable.id, restaurantId), eq(restaurantsTable.ownerId, Number(owner.id))))
    .limit(1);

  if (!restaurant) {
    throw new Error("You cannot view this restaurant");
  }

  return await db
    .select({
      id: menuItemsTable.id,
      restaurantId: menuItemsTable.restaurantId,
      name: menuItemsTable.name,
      price: menuItemsTable.price,
      image: menuItemsTable.image,
      description: menuItemsTable.description,
      categoryId: menuItemsTable.categoryId,
      isVeg: menuItemsTable.isVeg,
    })
    .from(menuItemsTable)
    .where(eq(menuItemsTable.restaurantId, restaurantId));
}

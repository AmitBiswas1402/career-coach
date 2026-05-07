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
  // Seed categories if needed
  await seedCategories();

  const categories = await db
    .select({ id: categoriesTable.id, name: categoriesTable.name })
    .from(categoriesTable);

  let ownerRestaurants: Array<typeof restaurantsTable.$inferSelect> = [];
  let items: typeof menuItemsTable.$inferSelect[] = [];

  try {
    ownerRestaurants = await db
      .select({
        id: restaurantsTable.id,
        name: restaurantsTable.name,
        address: restaurantsTable.address,
        image: restaurantsTable.image,
        type: restaurantsTable.type,
        rating: restaurantsTable.rating,
        createdAt: restaurantsTable.createdAt,
        published: restaurantsTable.published,
        ownerId: restaurantsTable.ownerId,
      })
      .from(restaurantsTable)
      .where(eq(restaurantsTable.ownerId, Number(owner.id)));

    if (ownerRestaurants.length > 0) {
      const restaurantIds = ownerRestaurants.map((r) => r.id);
      items = await db
        .select({
          id: menuItemsTable.id,
          createdAt: menuItemsTable.createdAt,
          restaurantId: menuItemsTable.restaurantId,
          name: menuItemsTable.name,
          price: menuItemsTable.price,
          image: menuItemsTable.image,
          description: menuItemsTable.description,
          categoryId: menuItemsTable.categoryId,
          isVeg: menuItemsTable.isVeg,
        })
        .from(menuItemsTable)
        .where(inArray(menuItemsTable.restaurantId, restaurantIds));
    }
  } catch (error) {
    console.error("Owner dashboard query failed:", error);
    return {
      owner,
      categories,
      restaurants: [],
      menuItemsByRestaurant: {} as Record<number, typeof menuItemsTable.$inferSelect[]>,
    };
  }

  const menuItemsByRestaurant = items.reduce<Record<number, typeof items>>((acc, item) => {
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

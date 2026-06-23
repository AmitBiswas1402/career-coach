import { and, eq, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import {
  categoriesTable,
  menuItemsTable,
  restaurantCategoriesTable,
  restaurantsTable,
} from "./schema";
import { restaurants as staticRestaurants } from "../lib/resturants";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not configured.");
}

const sql = neon(databaseUrl);
const db = drizzle({ client: sql });

const staticFoodCategories = [
  { id: 1, name: "North Indian" },
  { id: 2, name: "Biryani" },
  { id: 3, name: "Chinese" },
  { id: 4, name: "Desserts" },
  { id: 5, name: "Cake" },
  { id: 6, name: "Pizza" },
  { id: 7, name: "Rolls" },
  { id: 8, name: "South Indian" },
  { id: 9, name: "Idli" },
  { id: 10, name: "Burger" },
  { id: 11, name: "Jalebi" },
  { id: 12, name: "Dosa" },
  { id: 13, name: "Tea" },
  { id: 14, name: "Paratha" },
  { id: 15, name: "Poori" },
  { id: 16, name: "Salad" },
  { id: 17, name: "Pastry" },
  { id: 18, name: "Rasgulla" },
  { id: 19, name: "Vada" },
  { id: 20, name: "Chole Bhature" },
] as const;

type StaticRestaurant = (typeof staticRestaurants)[number];
type StaticMenuItem = StaticRestaurant["menu"][number];

async function syncStaticDataToNeon() {
  const allCategoryNames = staticFoodCategories.map((category) => category.name);
  const existingCategories = await db
    .select({ name: categoriesTable.name })
    .from(categoriesTable)
    .where(inArray(categoriesTable.name, allCategoryNames));

  const existingCategoryNameSet = new Set(
    existingCategories.map((category) => category.name)
  );
  const missingCategories = allCategoryNames
    .filter((name) => !existingCategoryNameSet.has(name))
    .map((name) => ({ name }));

  if (missingCategories.length > 0) {
    await db.insert(categoriesTable).values(missingCategories);
  }

  const dbCategories = await db
    .select({ id: categoriesTable.id, name: categoriesTable.name })
    .from(categoriesTable);

  const dbCategoryIdByName = new Map(
    dbCategories.map((category) => [category.name.toLowerCase(), category.id])
  );
  const foodCategoryNameByStaticId = new Map(
    staticFoodCategories.map((category) => [category.id, category.name.toLowerCase()])
  );

  let restaurantsUpserted = 0;
  let menuItemsUpserted = 0;
  let categoryLinksUpserted = 0;

  for (const staticRestaurant of staticRestaurants) {
    const [existingRestaurant] = await db
      .select({ id: restaurantsTable.id })
      .from(restaurantsTable)
      .where(eq(restaurantsTable.name, staticRestaurant.name))
      .limit(1);

    const restaurantPayload = {
      name: staticRestaurant.name,
      address: staticRestaurant.description,
      image: staticRestaurant.image,
      type: staticRestaurant.type as "veg" | "non-veg" | "both",
      rating: String(staticRestaurant.rating),
      published: true,
    };

    let restaurantId: number;

    if (existingRestaurant) {
      const [updatedRestaurant] = await db
        .update(restaurantsTable)
        .set(restaurantPayload)
        .where(eq(restaurantsTable.id, existingRestaurant.id))
        .returning({ id: restaurantsTable.id });

      restaurantId = updatedRestaurant.id;
    } else {
      const [insertedRestaurant] = await db
        .insert(restaurantsTable)
        .values({
          ...restaurantPayload,
          ownerId: null,
        })
        .returning({ id: restaurantsTable.id });

      restaurantId = insertedRestaurant.id;
    }

    restaurantsUpserted += 1;

    const mappedCategoryIds = staticRestaurant.categories
      .map((staticCategoryId) => {
        const categoryName = foodCategoryNameByStaticId.get(staticCategoryId);
        if (!categoryName) return null;
        return dbCategoryIdByName.get(categoryName) ?? null;
      })
      .filter((categoryId): categoryId is number => Number.isFinite(categoryId));

    await db
      .delete(restaurantCategoriesTable)
      .where(eq(restaurantCategoriesTable.restaurantId, restaurantId));

    if (mappedCategoryIds.length > 0) {
      await db.insert(restaurantCategoriesTable).values(
        mappedCategoryIds.map((categoryId) => ({
          restaurantId,
          categoryId,
        }))
      );
      categoryLinksUpserted += mappedCategoryIds.length;
    }

    const defaultMenuCategoryId = mappedCategoryIds[0] ?? null;
    const existingItems = await db
      .select({ id: menuItemsTable.id, name: menuItemsTable.name })
      .from(menuItemsTable)
      .where(eq(menuItemsTable.restaurantId, restaurantId));

    const existingItemIdByName = new Map(
      existingItems.map((item) => [item.name.toLowerCase(), item.id])
    );

    for (const staticMenuItem of staticRestaurant.menu as StaticMenuItem[]) {
      const existingItemId = existingItemIdByName.get(
        staticMenuItem.name.toLowerCase()
      );

      const menuItemPayload = {
        name: staticMenuItem.name,
        price: Math.round(Number(staticMenuItem.price) * 100),
        description: null,
        image: null,
        categoryId: defaultMenuCategoryId,
      };

      if (existingItemId) {
        await db
          .update(menuItemsTable)
          .set(menuItemPayload)
          .where(eq(menuItemsTable.id, existingItemId));
      } else {
        await db.insert(menuItemsTable).values({
          restaurantId,
          ...menuItemPayload,
          isVeg: staticRestaurant.type === "veg" ? true : null,
        });
      }

      menuItemsUpserted += 1;
    }
  }

  console.log("Neon sync complete.");
  console.log(`Restaurants upserted: ${restaurantsUpserted}`);
  console.log(`Menu items upserted: ${menuItemsUpserted}`);
  console.log(`Restaurant-category links upserted: ${categoryLinksUpserted}`);
}

syncStaticDataToNeon()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Failed to sync static data to Neon:", error);
    process.exit(1);
  });

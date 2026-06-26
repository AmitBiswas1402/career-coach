import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { restaurantsTable, usersTable, restaurantCategoriesTable, categoriesTable } from "@/db/schema";
import { and, eq, inArray } from "drizzle-orm";

const restaurantSelectFields = {
  id: restaurantsTable.id,
  name: restaurantsTable.name,
  address: restaurantsTable.address,
  image: restaurantsTable.image,
  type: restaurantsTable.type,
  rating: restaurantsTable.rating,
  published: restaurantsTable.published,
  ownerId: restaurantsTable.ownerId,
};

async function getOwnerContext() {
  const { userId } = await auth();

  if (!userId) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const user = await currentUser();

  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const email = user.emailAddresses[0].emailAddress;
  const [dbUser] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email))
    .limit(1);

  if (!dbUser) {
    return { error: NextResponse.json({ error: "User not found" }, { status: 404 }) };
  }

  return { dbUser };
}

// POST: Create a new restaurant
export async function POST(req: NextRequest) {
  try {
    const context = await getOwnerContext();

    if ("error" in context) return context.error;

    const { dbUser } = context;

    if (!dbUser || dbUser.role !== "restaurant_owner") {
      return NextResponse.json(
        { error: "Only restaurant owners can create restaurants" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const name = String(body.name ?? "").trim();
    const address = body.address ? String(body.address).trim() : null;
    const type = String(body.type ?? "both") as "veg" | "non-veg" | "both";
    const image = body.image ? String(body.image) : null;
    const rating = body.rating ? String(body.rating) : "4.5";
    const categories = Array.isArray(body.categories) ? body.categories.map((c: any) => Number(c)) : [];

    if (!name || !type) {
      return NextResponse.json({ error: "Name and type are required" }, { status: 400 });
    }

    // Insert restaurant (attempt full insert first)
    try {
      const [restaurant] = await db
        .insert(restaurantsTable)
        .values({
          name,
          address: address || null,
          type: type as "veg" | "non-veg" | "both",
          image: image || null,
          rating: rating,
          published: false,
          ownerId: Number(dbUser.id),
        })
        .returning(restaurantSelectFields);

      // If categories provided, link them
      if (restaurant && categories.length > 0) {
        const values = categories
          .filter((c: any) => Number.isFinite(c))
          .map((catId: any) => ({ restaurantId: restaurant.id, categoryId: Number(catId) }));

        if (values.length > 0) {
          try {
            await db.insert(restaurantCategoriesTable).values(values as any[]);
          } catch (catErr) {
            console.error("Failed to insert restaurant categories:", catErr);
            // continue; categories are optional
          }
        }
      }

      return NextResponse.json(restaurant, { status: 201 });
    } catch (err: any) {
      console.error("Create restaurant error (full insert):", err);
      // If column missing in DB (migration not applied), fall back to minimal insert
      const message = String(err?.message || "").toLowerCase();
      const causeMessage = String(err?.cause?.message || "").toLowerCase();
      const code = String(err?.code || err?.cause?.code || "");
      if (
        code === "42703" ||
        message.includes("does not exist") ||
        message.includes("column") ||
        causeMessage.includes("does not exist") ||
        causeMessage.includes("column")
      ) {
        try {
          const [row] = await db
            .insert(restaurantsTable)
            .values({
              name,
              type: type as "veg" | "non-veg" | "both",
              rating: rating,
              published: false,
              ownerId: Number(dbUser.id),
            })
            .returning({ id: restaurantsTable.id });

          const insertedId = row?.id;

          // Try to insert categories if possible
          if (insertedId && categories.length > 0) {
            try {
              const values = categories
                .filter((c: any) => Number.isFinite(c))
                .map((catId: any) => ({ restaurantId: insertedId, categoryId: Number(catId) }));
              if (values.length > 0) await db.insert(restaurantCategoriesTable).values(values as any[]);
            } catch (catErr) {
              console.error("Failed to link categories on fallback insert:", catErr);
            }
          }

          const fallbackResp = {
            id: insertedId,
            name,
            address: address || null,
            image: image || null,
            type,
            rating,
            published: false,
            ownerId: Number(dbUser.id),
          };

          return NextResponse.json(fallbackResp, { status: 201 });
        } catch (fallbackErr) {
          console.error("Fallback insert failed:", fallbackErr);
          return NextResponse.json({ error: "Failed to create restaurant (fallback)" }, { status: 500 });
        }
      }

      return NextResponse.json({ error: "Failed to create restaurant" }, { status: 500 });
    }
  } catch (error) {
    console.error("Create restaurant error:", error);
    return NextResponse.json(
      { error: "Failed to create restaurant" },
      { status: 500 }
    );
  }
}

// PUT: Update a restaurant
export async function PUT(req: NextRequest) {
  try {
    const context = await getOwnerContext();

    if ("error" in context) return context.error;

    const { dbUser } = context;

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { id, name, address, type, image, published, categories } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: "Restaurant ID is required" },
        { status: 400 }
      );
    }

    const [restaurant] = await db
      .select(restaurantSelectFields)
      .from(restaurantsTable)
      .where(eq(restaurantsTable.id, id))
      .limit(1);

    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }

    if (restaurant.ownerId !== dbUser.id) {
      return NextResponse.json(
        { error: "You can only update your own restaurants" },
        { status: 403 }
      );
    }

    const [updated] = await db
      .update(restaurantsTable)
      .set({
        ...(name && { name }),
        ...(address !== undefined && { address }),
        ...(type && { type: type as "veg" | "non-veg" | "both" }),
        ...(image && { image }),
        ...(published !== undefined && { published: Boolean(published) }),
      })
      .where(eq(restaurantsTable.id, id))
      .returning(restaurantSelectFields);

    if (Array.isArray(categories)) {
      const categoryIds = categories
        .map((c: unknown) => Number(c))
        .filter((c: number) => Number.isFinite(c));

      await db
        .delete(restaurantCategoriesTable)
        .where(eq(restaurantCategoriesTable.restaurantId, id));

      if (categoryIds.length > 0) {
        await db.insert(restaurantCategoriesTable).values(
          categoryIds.map((categoryId) => ({ restaurantId: id, categoryId }))
        );
      }
    }

    let linkedCategories: { id: number; name: string }[] = [];
    const categoryRows = await db
      .select({
        categoryId: categoriesTable.id,
        categoryName: categoriesTable.name,
      })
      .from(restaurantCategoriesTable)
      .innerJoin(categoriesTable, eq(categoriesTable.id, restaurantCategoriesTable.categoryId))
      .where(eq(restaurantCategoriesTable.restaurantId, id));

    linkedCategories = categoryRows.map((row) => ({
      id: row.categoryId,
      name: row.categoryName,
    }));

    return NextResponse.json({ ...updated, categories: linkedCategories });
  } catch (error) {
    console.error("Update restaurant error:", error);
    return NextResponse.json(
      { error: "Failed to update restaurant" },
      { status: 500 }
    );
  }
}

// DELETE: Remove a restaurant
export async function DELETE(req: NextRequest) {
  try {
    const context = await getOwnerContext();

    if ("error" in context) return context.error;

    const { dbUser } = context;
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "Restaurant ID is required" }, { status: 400 });
    }

    const [restaurant] = await db
      .select(restaurantSelectFields)
      .from(restaurantsTable)
      .where(eq(restaurantsTable.id, id))
      .limit(1);

    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }

    if (restaurant.ownerId !== dbUser.id) {
      return NextResponse.json({ error: "You can only delete your own restaurants" }, { status: 403 });
    }

    await db.delete(restaurantsTable).where(eq(restaurantsTable.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete restaurant error:", error);
    return NextResponse.json({ error: "Failed to delete restaurant" }, { status: 500 });
  }
}

// GET: Fetch restaurants for the owner
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const isPublicRequest = url.searchParams.get("public") === "1";
    const restaurantIdParam = url.searchParams.get("id");

    if (isPublicRequest) {
      const publicFilters = [eq(restaurantsTable.published, true)];
      if (restaurantIdParam) {
        const parsedRestaurantId = Number(restaurantIdParam);
        if (!Number.isFinite(parsedRestaurantId)) {
          return NextResponse.json({ error: "Invalid restaurant id" }, { status: 400 });
        }
        publicFilters.push(eq(restaurantsTable.id, parsedRestaurantId));
      }

      const restaurants = await db
        .select(restaurantSelectFields)
        .from(restaurantsTable)
        .where(and(...publicFilters));

      if (restaurants.length === 0) {
        return NextResponse.json([]);
      }
      const restaurantIds = restaurants.map((restaurant) => restaurant.id);

      const categoryRows = await db
        .select({
          restaurantId: restaurantCategoriesTable.restaurantId,
          categoryId: categoriesTable.id,
          categoryName: categoriesTable.name,
        })
        .from(restaurantCategoriesTable)
        .innerJoin(categoriesTable, eq(categoriesTable.id, restaurantCategoriesTable.categoryId))
        .where(inArray(restaurantCategoriesTable.restaurantId, restaurantIds));

      const categoriesByRestaurant = categoryRows.reduce<Record<number, { id: number; name: string }[]>>((acc, row) => {
        if (!acc[row.restaurantId]) {
          acc[row.restaurantId] = [];
        }
        acc[row.restaurantId].push({ id: row.categoryId, name: row.categoryName });
        return acc;
      }, {});

      return NextResponse.json(
        restaurants.map((restaurant) => ({
          ...restaurant,
          categories: categoriesByRestaurant[restaurant.id] ?? [],
        }))
      );
    }

    const context = await getOwnerContext();

    if ("error" in context) return context.error;

    const { dbUser } = context;

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const ownerRestaurants = await db
      .select(restaurantSelectFields)
      .from(restaurantsTable)
      .where(eq(restaurantsTable.ownerId, Number(dbUser.id)));

    return NextResponse.json(ownerRestaurants);
  } catch (error) {
    console.error("Get restaurants error:", error);
    return NextResponse.json(
      { error: "Failed to fetch restaurants" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { menuItemsTable, restaurantsTable, usersTable } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";

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

// POST: Create a new menu item
export async function POST(req: NextRequest) {
  try {
    const context = await getOwnerContext();

    if ("error" in context) return context.error;

    const { dbUser } = context;

    if (!dbUser || dbUser.role !== "restaurant_owner") {
      return NextResponse.json(
        { error: "Only restaurant owners can create menu items" },
        { status: 403 }
      );
    }

    const { restaurantId, name, price, description, categoryId, isVeg, image } =
      await req.json();

    if (!restaurantId || !name || !price) {
      return NextResponse.json(
        { error: "Restaurant ID, name, and price are required" },
        { status: 400 }
      );
    }

    // Verify ownership
    const [restaurant] = await db
      .select()
      .from(restaurantsTable)
      .where(
        and(
          eq(restaurantsTable.id, restaurantId),
          eq(restaurantsTable.ownerId, dbUser.id)
        )
      )
      .limit(1);

    if (!restaurant) {
      return NextResponse.json(
        { error: "Restaurant not found or you don't own it" },
        { status: 403 }
      );
    }

    const [item] = await db
      .insert(menuItemsTable)
      .values({
        restaurantId,
        name,
        price: Math.round(price * 100),
        image: image || null,
        description: description || null,
        categoryId: categoryId || null,
        isVeg: isVeg ?? true,
      })
      .returning();

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("Create menu item error:", error);
    return NextResponse.json(
      { error: "Failed to create menu item" },
      { status: 500 }
    );
  }
}

// PUT: Update a menu item
export async function PUT(req: NextRequest) {
  try {
    const context = await getOwnerContext();

    if ("error" in context) return context.error;

    const { dbUser } = context;

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { id, name, price, description, categoryId, isVeg, image } =
      await req.json();

    if (!id) {
      return NextResponse.json(
        { error: "Item ID is required" },
        { status: 400 }
      );
    }

    // Verify ownership
    const [item] = await db
      .select()
      .from(menuItemsTable)
      .where(eq(menuItemsTable.id, id))
      .limit(1);

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const [restaurant] = await db
      .select()
      .from(restaurantsTable)
      .where(
        and(
          eq(restaurantsTable.id, item.restaurantId),
          eq(restaurantsTable.ownerId, dbUser.id)
        )
      )
      .limit(1);

    if (!restaurant) {
      return NextResponse.json(
        { error: "You don't have permission to update this item" },
        { status: 403 }
      );
    }

    const [updated] = await db
      .update(menuItemsTable)
      .set({
        ...(name && { name }),
        ...(price && { price: Math.round(price * 100) }),
        ...(description && { description }),
        ...(categoryId && { categoryId }),
        ...(isVeg !== undefined && { isVeg }),
        ...(image && { image }),
      })
      .where(eq(menuItemsTable.id, id))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Update menu item error:", error);
    return NextResponse.json(
      { error: "Failed to update menu item" },
      { status: 500 }
    );
  }
}

// DELETE: Delete a menu item
export async function DELETE(req: NextRequest) {
  try {
    const context = await getOwnerContext();

    if ("error" in context) return context.error;

    const { dbUser } = context;

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { id } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: "Item ID is required" },
        { status: 400 }
      );
    }

    // Verify ownership
    const [item] = await db
      .select()
      .from(menuItemsTable)
      .where(eq(menuItemsTable.id, id))
      .limit(1);

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const [restaurant] = await db
      .select()
      .from(restaurantsTable)
      .where(
        and(
          eq(restaurantsTable.id, item.restaurantId),
          eq(restaurantsTable.ownerId, dbUser.id)
        )
      )
      .limit(1);

    if (!restaurant) {
      return NextResponse.json(
        { error: "You don't have permission to delete this item" },
        { status: 403 }
      );
    }

    await db.delete(menuItemsTable).where(eq(menuItemsTable.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete menu item error:", error);
    return NextResponse.json(
      { error: "Failed to delete menu item" },
      { status: 500 }
    );
  }
}

// GET: Fetch menu items for a specific restaurant or all restaurants owned by the user
export async function GET(req: NextRequest) {
  try {
    const context = await getOwnerContext();

    if ("error" in context) return context.error;

    const { dbUser } = context;
    const url = new URL(req.url);
    const restaurantId = url.searchParams.get("restaurantId");

    if (restaurantId) {
      const parsedRestaurantId = Number(restaurantId);

      if (!Number.isFinite(parsedRestaurantId)) {
        return NextResponse.json({ error: "Invalid restaurantId" }, { status: 400 });
      }

      const [restaurant] = await db
        .select({ id: restaurantsTable.id })
        .from(restaurantsTable)
        .where(and(eq(restaurantsTable.id, parsedRestaurantId), eq(restaurantsTable.ownerId, dbUser.id)))
        .limit(1);

      if (!restaurant) {
        return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
      }

      const items = await db
        .select()
        .from(menuItemsTable)
        .where(eq(menuItemsTable.restaurantId, parsedRestaurantId));

      return NextResponse.json(items);
    }

    const restaurants = await db
      .select({ id: restaurantsTable.id })
      .from(restaurantsTable)
      .where(eq(restaurantsTable.ownerId, dbUser.id));

    if (restaurants.length === 0) {
      return NextResponse.json([]);
    }

    const restaurantIds = restaurants.map((restaurant) => restaurant.id);
    const items = await db
      .select()
      .from(menuItemsTable)
      .where(inArray(menuItemsTable.restaurantId, restaurantIds));

    return NextResponse.json(items);
  } catch (error) {
    console.error("Get menu items error:", error);
    return NextResponse.json(
      { error: "Failed to fetch menu items" },
      { status: 500 }
    );
  }
}

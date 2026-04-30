import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { restaurantsTable, usersTable } from "@/db/schema";
import { eq } from "drizzle-orm";

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

    const { name, address, type, image } = await req.json();

    if (!name || !type) {
      return NextResponse.json(
        { error: "Name and type are required" },
        { status: 400 }
      );
    }

    const [restaurant] = await db
      .insert(restaurantsTable)
      .values({
        name,
        address: address || null,
        type: type as "veg" | "non-veg" | "both",
        image: image || null,
        rating: "4.5",
        ownerId: dbUser.id,
      })
      .returning();

    return NextResponse.json(restaurant, { status: 201 });
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

    const { id, name, address, type, image } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: "Restaurant ID is required" },
        { status: 400 }
      );
    }

    const [restaurant] = await db
      .select()
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
        ...(address && { address }),
        ...(type && { type: type as "veg" | "non-veg" | "both" }),
        ...(image && { image }),
      })
      .where(eq(restaurantsTable.id, id))
      .returning();

    return NextResponse.json(updated);
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
      .select()
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
    const context = await getOwnerContext();

    if ("error" in context) return context.error;

    const { dbUser } = context;

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const restaurants = await db
      .select()
      .from(restaurantsTable)
      .where(eq(restaurantsTable.ownerId, dbUser.id));

    return NextResponse.json(restaurants);
  } catch (error) {
    console.error("Get restaurants error:", error);
    return NextResponse.json(
      { error: "Failed to fetch restaurants" },
      { status: 500 }
    );
  }
}

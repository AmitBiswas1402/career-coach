import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { restaurantsTable, usersTable, restaurantCategoriesTable } from "@/db/schema";
import { eq } from "drizzle-orm";

const restaurantSelectFields = {
  id: restaurantsTable.id,
  name: restaurantsTable.name,
  address: restaurantsTable.address,
  image: restaurantsTable.image,
  type: restaurantsTable.type,
  rating: restaurantsTable.rating,
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
      if (err?.code === "42703" || message.includes("does not exist") || message.includes("column")) {
        try {
          const [row] = await db
            .insert(restaurantsTable)
            .values({ name, type: type as "veg" | "non-veg" | "both", rating: rating, ownerId: Number(dbUser.id) })
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

    const { id, name, address, type, image } = await req.json();

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
        ...(address && { address }),
        ...(type && { type: type as "veg" | "non-veg" | "both" }),
        ...(image && { image }),
      })
      .where(eq(restaurantsTable.id, id))
      .returning(restaurantSelectFields);

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
    const context = await getOwnerContext();

    if ("error" in context) return context.error;

    const { dbUser } = context;

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const restaurants = await db
      .select(restaurantSelectFields)
      .from(restaurantsTable)
      .where(eq(restaurantsTable.ownerId, Number(dbUser.id)));

    return NextResponse.json(restaurants);
  } catch (error) {
    console.error("Get restaurants error:", error);
    return NextResponse.json(
      { error: "Failed to fetch restaurants" },
      { status: 500 }
    );
  }
}

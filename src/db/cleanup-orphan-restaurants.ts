/**
 * One-time cleanup: removes legacy restaurants synced from static data
 * (ownerId IS NULL) that owners cannot manage in the dashboard.
 *
 * Run once: npx tsx src/db/cleanup-orphan-restaurants.ts
 */
import "dotenv/config";
import { isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { restaurantsTable } from "./schema";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not configured.");
}

const sql = neon(databaseUrl);
const db = drizzle({ client: sql });

async function cleanupOrphanRestaurants() {
  const deleted = await db
    .delete(restaurantsTable)
    .where(isNull(restaurantsTable.ownerId))
    .returning({ id: restaurantsTable.id, name: restaurantsTable.name });

  console.log(`Removed ${deleted.length} orphan restaurant(s).`);
  if (deleted.length > 0) {
    for (const restaurant of deleted) {
      console.log(`  - #${restaurant.id}: ${restaurant.name}`);
    }
  }
}

cleanupOrphanRestaurants()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Failed to cleanup orphan restaurants:", error);
    process.exit(1);
  });

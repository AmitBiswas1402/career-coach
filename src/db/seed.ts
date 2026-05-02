import { db } from "@/db";
import { categoriesTable } from "@/db/schema";
import { foodCategories } from "@/lib/foods";
import { inArray } from "drizzle-orm";

export async function seedCategories() {
  const allCategoryNames = foodCategories.map((cat) => cat.name);

  const existing = await db
    .select({ name: categoriesTable.name })
    .from(categoriesTable)
    .where(inArray(categoriesTable.name, allCategoryNames));

  const existingNames = new Set(existing.map((row) => row.name));

  const missingCategories = foodCategories
    .filter((cat) => !existingNames.has(cat.name))
    .map((cat) => ({ name: cat.name }));

  if (missingCategories.length === 0) {
    return;
  }

  await db.insert(categoriesTable).values(missingCategories);
}

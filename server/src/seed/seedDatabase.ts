import type { SeedCategory } from "@budget-draft/shared";
import { CategoryModel } from "../models/Category";
import { ItemModel } from "../models/Item";

export interface SeedSummary {
  categories: number;
  items: number;
}

// Replaces ALL categories and items with the seed data.
// Clearing first (instead of upserting) is the simplest way to guarantee
// no duplicates and no leftovers from older seed files.
// GameResults are left alone: they store their own snapshots of items.
export async function seedDatabase(categories: SeedCategory[]): Promise<SeedSummary> {
  // Make sure the unique indexes exist before inserting, so a duplicate
  // in the data is rejected by MongoDB instead of being silently stored.
  await CategoryModel.syncIndexes();
  await ItemModel.syncIndexes();

  await ItemModel.deleteMany({});
  await CategoryModel.deleteMany({});

  const categoryDocs = [];
  const itemDocs = [];
  for (const category of categories) {
    categoryDocs.push({
      slug: category.slug,
      name: category.name,
      emoji: category.emoji,
      description: category.description,
    });
    for (const item of category.items) {
      itemDocs.push({ ...item, categorySlug: category.slug });
    }
  }

  await CategoryModel.insertMany(categoryDocs);
  await ItemModel.insertMany(itemDocs);

  return { categories: categoryDocs.length, items: itemDocs.length };
}

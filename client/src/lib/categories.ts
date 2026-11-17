import type { Category, Item } from "@budget-draft/shared";
import { bundledCategories } from "../data/bundledCategories";

// Every page gets categories through these two functions, so switching the
// source (bundled JSON now, the API later) only touches this file.

export async function fetchCategories(): Promise<Category[]> {
  const categories: Category[] = [];
  for (const entry of bundledCategories) {
    categories.push(entry.category);
  }
  return categories;
}

export async function fetchCategoryItems(slug: string): Promise<Item[]> {
  for (const entry of bundledCategories) {
    if (entry.category.slug === slug) {
      return entry.items;
    }
  }
  throw new Error(`Unknown category "${slug}"`);
}

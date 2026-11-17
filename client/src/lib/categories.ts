import type { Category, Item } from "@budget-draft/shared";
import { bundledCategories } from "../data/bundledCategories";
import { apiRequest } from "./api";

// Every page gets categories through these functions. They ask the API first
// (so admin edits show up) and fall back to the JSON bundled into the app,
// so pass-and-play still works with no server running.

const API_TIMEOUT_MS = 3000;

function bundledCategoryList(): Category[] {
  const categories: Category[] = [];
  for (const entry of bundledCategories) {
    categories.push(entry.category);
  }
  return categories;
}

function bundledItems(slug: string): Item[] {
  for (const entry of bundledCategories) {
    if (entry.category.slug === slug) {
      return entry.items;
    }
  }
  throw new Error(`Unknown category "${slug}"`);
}

export async function fetchCategories(): Promise<Category[]> {
  try {
    const categories = await apiRequest<Category[]>("/api/categories", { timeoutMs: API_TIMEOUT_MS });
    // An empty database (not seeded yet) is less useful than the bundled list.
    if (categories.length > 0) {
      return categories;
    }
  } catch (error) {
    console.info("Using bundled categories:", error instanceof Error ? error.message : error);
  }
  return bundledCategoryList();
}

export async function fetchCategoryItems(slug: string): Promise<Item[]> {
  try {
    return await apiRequest<Item[]>(`/api/categories/${encodeURIComponent(slug)}/items`, {
      timeoutMs: API_TIMEOUT_MS,
    });
  } catch (error) {
    console.info("Using bundled items:", error instanceof Error ? error.message : error);
  }
  return bundledItems(slug);
}

import type { Category, Item } from "@budget-draft/shared";
import { CategoryModel } from "../models/Category";
import { ItemModel } from "../models/Item";

// The only place that reads categories and items from MongoDB, so routes
// and sockets get plain shared types (Category, Item) instead of mongoose documents.

export async function listCategories(): Promise<Category[]> {
  const categories = await CategoryModel.find().sort({ name: 1 }).lean();

  // Count items per category in one query instead of one query per category.
  const counts = await ItemModel.aggregate<{ _id: string; count: number }>([
    { $group: { _id: "$categorySlug", count: { $sum: 1 } } },
  ]);
  const countBySlug = new Map<string, number>();
  for (const row of counts) {
    countBySlug.set(row._id, row.count);
  }

  const result: Category[] = [];
  for (const category of categories) {
    result.push({
      slug: category.slug,
      name: category.name,
      emoji: category.emoji,
      description: category.description,
      itemCount: countBySlug.get(category.slug) ?? 0,
      roles: category.roles ?? [], // older databases may not have the field
    });
  }
  return result;
}

export async function categoryExists(slug: string): Promise<boolean> {
  const found = await CategoryModel.exists({ slug });
  return found !== null;
}

// A category's Balanced team roles, or null if the category doesn't exist.
export async function getCategoryRoles(slug: string): Promise<string[] | null> {
  const category = await CategoryModel.findOne({ slug }, { roles: 1 }).lean();
  if (!category) {
    return null;
  }
  return category.roles ?? [];
}

// Everything needed to start a game in this category, or null if it doesn't exist.
export async function loadCategoryForGame(slug: string): Promise<{ items: Item[]; roles: string[] } | null> {
  const roles = await getCategoryRoles(slug);
  const items = await getCategoryItems(slug);
  if (roles === null || items === null) {
    return null;
  }
  return { items, roles };
}

// Returns null when the category doesn't exist (so routes can send a 404).
export async function getCategoryItems(slug: string): Promise<Item[] | null> {
  if (!(await categoryExists(slug))) {
    return null;
  }
  const docs = await ItemModel.find({ categorySlug: slug }).sort({ rating: -1 }).lean();
  const items: Item[] = [];
  for (const doc of docs) {
    const item: Item = {
      id: String(doc._id),
      name: doc.name,
      category: doc.categorySlug,
      price: doc.price,
      rating: doc.rating,
      tag: doc.tag,
    };
    if (doc.emoji) {
      item.emoji = doc.emoji;
    }
    items.push(item);
  }
  return items;
}

import { seedCategorySchema, type Category, type Item } from "@budget-draft/shared";

// The seed JSON files are bundled into the app at build time, so
// pass-and-play and bot games work with no server at all.
// `eager: true` means the files are included directly instead of loaded later.
const seedModules = import.meta.glob<unknown>("../../../server/seed/*.json", {
  eager: true,
  import: "default",
});

export interface CategoryWithItems {
  category: Category;
  items: Item[];
}

function buildBundledCategories(): CategoryWithItems[] {
  const result: CategoryWithItems[] = [];
  for (const [path, raw] of Object.entries(seedModules)) {
    // Validate anyway: a broken file should show up as a clear error, not a blank screen.
    const parsed = seedCategorySchema.safeParse(raw);
    if (!parsed.success) {
      console.error(`Skipping invalid bundled seed file ${path}`, parsed.error.issues);
      continue;
    }
    const seed = parsed.data;
    const items: Item[] = [];
    for (let i = 0; i < seed.items.length; i++) {
      const seedItem = seed.items[i];
      if (!seedItem) {
        continue;
      }
      const item: Item = {
        // Bundled items have no database id, so we make a stable one from the position.
        id: `${seed.slug}-${i}`,
        name: seedItem.name,
        category: seed.slug,
        price: seedItem.price,
        rating: seedItem.rating,
        tag: seedItem.tag,
      };
      if (seedItem.emoji !== undefined) {
        item.emoji = seedItem.emoji;
      }
      items.push(item);
    }
    result.push({
      category: {
        slug: seed.slug,
        name: seed.name,
        emoji: seed.emoji,
        description: seed.description,
        itemCount: items.length,
        roles: seed.roles,
      },
      items,
    });
  }
  result.sort((a, b) => a.category.name.localeCompare(b.category.name));
  return result;
}

export const bundledCategories: CategoryWithItems[] = buildBundledCategories();

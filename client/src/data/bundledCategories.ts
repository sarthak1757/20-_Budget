import { itemsFromSeed, seedCategorySchema, type Category, type Item, type SeedCategory } from "@budget-draft/shared";

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

function loadBundledSeeds(): SeedCategory[] {
  const seeds: SeedCategory[] = [];
  for (const [path, raw] of Object.entries(seedModules)) {
    // Validate anyway: a broken file should show up as a clear error, not a blank screen.
    const parsed = seedCategorySchema.safeParse(raw);
    if (!parsed.success) {
      console.error(`Skipping invalid bundled seed file ${path}`, parsed.error.issues);
      continue;
    }
    seeds.push(parsed.data);
  }
  return seeds;
}

// The raw seed files. The Daily Challenge builds its game from these, exactly
// as the server does when it checks a daily score.
export const bundledSeeds: SeedCategory[] = loadBundledSeeds();

function buildBundledCategories(): CategoryWithItems[] {
  const result: CategoryWithItems[] = [];
  for (const seed of bundledSeeds) {
    // Bundled items have no database id; itemsFromSeed makes a stable one from the position.
    const items = itemsFromSeed(seed);
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

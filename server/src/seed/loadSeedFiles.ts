import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { seedCategorySchema, type SeedCategory } from "@budget-draft/shared";

// server/seed, relative to this file (server/src/seed).
export const SEED_DIR = join(import.meta.dirname, "..", "..", "seed");

export function listSeedFiles(dir: string = SEED_DIR): string[] {
  const files: string[] = [];
  for (const fileName of readdirSync(dir)) {
    if (fileName.endsWith(".json")) {
      files.push(join(dir, fileName));
    }
  }
  files.sort();
  return files;
}

// Reads and validates one seed file. Throws an error naming the file and the
// problem, so a typo in seed data is easy to find.
export function loadSeedFile(filePath: string): SeedCategory {
  const raw: unknown = JSON.parse(readFileSync(filePath, "utf8"));
  const result = seedCategorySchema.safeParse(raw);
  if (!result.success) {
    const firstIssue = result.error.issues[0];
    const where = firstIssue ? firstIssue.path.join(".") : "?";
    const message = firstIssue ? firstIssue.message : "invalid";
    throw new Error(`${filePath}: ${where}: ${message}`);
  }

  const category = result.data;
  const duplicates = findDuplicateNames(category);
  if (duplicates.length > 0) {
    throw new Error(`${filePath}: duplicate item names: ${duplicates.join(", ")}`);
  }
  return category;
}

export function loadAllSeedFiles(dir: string = SEED_DIR): SeedCategory[] {
  const categories: SeedCategory[] = [];
  const seenSlugs = new Set<string>();
  for (const filePath of listSeedFiles(dir)) {
    const category = loadSeedFile(filePath);
    if (seenSlugs.has(category.slug)) {
      throw new Error(`${filePath}: slug "${category.slug}" is used by another file`);
    }
    seenSlugs.add(category.slug);
    categories.push(category);
  }
  return categories;
}

// Case-insensitive, so "Hot Dog" and "hot dog" count as the same item.
export function findDuplicateNames(category: SeedCategory): string[] {
  const seen = new Set<string>();
  const duplicates: string[] = [];
  for (const item of category.items) {
    const key = item.name.trim().toLowerCase();
    if (seen.has(key)) {
      duplicates.push(item.name);
    }
    seen.add(key);
  }
  return duplicates;
}

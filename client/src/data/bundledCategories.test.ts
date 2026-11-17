import { describe, expect, it } from "vitest";
import { bundledCategories } from "./bundledCategories";

describe("bundledCategories", () => {
  it("bundles every seed file", () => {
    expect(bundledCategories.length).toBeGreaterThanOrEqual(10);
  });

  it("gives every item a unique id and matching category", () => {
    const ids = new Set<string>();
    for (const entry of bundledCategories) {
      expect(entry.category.itemCount).toBe(entry.items.length);
      for (const item of entry.items) {
        expect(ids.has(item.id)).toBe(false);
        ids.add(item.id);
        expect(item.category).toBe(entry.category.slug);
      }
    }
  });
});

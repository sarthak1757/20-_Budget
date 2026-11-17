import { describe, expect, it } from "vitest";
import { MAX_PRICE, MIN_PRICE } from "@budget-draft/shared";
import { findDuplicateNames, listSeedFiles, loadAllSeedFiles, loadSeedFile } from "../loadSeedFiles";
import { classifyPrice, expectedPrice } from "../pricing";

const files = listSeedFiles();

describe("seed folder", () => {
  it("has at least 6 categories with unique slugs", () => {
    expect(files.length).toBeGreaterThanOrEqual(6);
    // loadAllSeedFiles throws if two files share a slug.
    expect(loadAllSeedFiles().length).toBe(files.length);
  });
});

describe.each(files)("%s", (filePath) => {
  const category = loadSeedFile(filePath);

  it("matches the schema (loadSeedFile validates)", () => {
    expect(category.slug.length).toBeGreaterThan(0);
  });

  it("has 40+ items", () => {
    expect(category.items.length).toBeGreaterThanOrEqual(40);
  });

  it("has prices 1–10, ratings 1–100 and a tag on every item", () => {
    for (const item of category.items) {
      expect(item.price, item.name).toBeGreaterThanOrEqual(MIN_PRICE);
      expect(item.price, item.name).toBeLessThanOrEqual(MAX_PRICE);
      expect(item.rating, item.name).toBeGreaterThanOrEqual(1);
      expect(item.rating, item.name).toBeLessThanOrEqual(100);
      expect(item.tag.trim().length, item.name).toBeGreaterThan(0);
    }
  });

  it("has no duplicate names", () => {
    expect(findDuplicateNames(category)).toEqual([]);
  });

  it("prices roughly follow ratings, with 2–3 bargains and 2–3 overpriced items", () => {
    let bargains = 0;
    let overpriced = 0;
    for (const item of category.items) {
      const kind = classifyPrice(item.price, item.rating);
      if (kind === "bargain") {
        bargains += 1;
      } else if (kind === "overpriced") {
        overpriced += 1;
      } else {
        // "Roughly": a normal item may be off by $1 at most.
        const gap = Math.abs(item.price - expectedPrice(item.rating));
        expect(gap, item.name).toBeLessThanOrEqual(1);
      }
    }
    expect(bargains).toBeGreaterThanOrEqual(2);
    expect(bargains).toBeLessThanOrEqual(3);
    expect(overpriced).toBeGreaterThanOrEqual(2);
    expect(overpriced).toBeLessThanOrEqual(3);
  });

  it("has enough cheap items to fill a team (at least 8 items at $1–3)", () => {
    let cheap = 0;
    for (const item of category.items) {
      if (item.price <= 3) {
        cheap += 1;
      }
    }
    expect(cheap).toBeGreaterThanOrEqual(8);
  });
});

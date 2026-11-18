import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { CategoryModel } from "../../models/Category";
import { DailyResultModel } from "../../models/DailyResult";
import { GameResultModel } from "../../models/GameResult";
import { ItemModel } from "../../models/Item";
import { startMemoryMongo } from "../../test/memoryMongo";
import { loadAllSeedFiles } from "../loadSeedFiles";
import { seedDatabase } from "../seedDatabase";

let stopMongo: () => Promise<void>;

beforeAll(async () => {
  stopMongo = await startMemoryMongo();
});

afterAll(async () => {
  await stopMongo();
});

describe("seedDatabase", () => {
  const categories = loadAllSeedFiles();
  let expectedItems = 0;
  for (const category of categories) {
    expectedItems += category.items.length;
  }

  it("inserts every category and item", async () => {
    const summary = await seedDatabase(categories);
    expect(summary).toEqual({ categories: categories.length, items: expectedItems });
    expect(await CategoryModel.countDocuments()).toBe(categories.length);
    expect(await ItemModel.countDocuments()).toBe(expectedItems);
  });

  it("running it again does not create duplicates", async () => {
    await seedDatabase(categories);
    await seedDatabase(categories);
    expect(await CategoryModel.countDocuments()).toBe(categories.length);
    expect(await ItemModel.countDocuments()).toBe(expectedItems);
  });

  it("the unique index rejects a duplicate item in the same category", async () => {
    const existing = await ItemModel.findOne({ categorySlug: "football" }).lean();
    expect(existing).not.toBeNull();
    await expect(
      ItemModel.create({ name: existing?.name, categorySlug: "football", price: 1, rating: 1, tag: "Copy" }),
    ).rejects.toThrow(/duplicate key/);
  });

  it("leaves saved game results and daily scores alone", async () => {
    // Raw inserts: only the documents' survival matters here, not their shape.
    await GameResultModel.collection.insertOne({ marker: "keep-me" });
    await DailyResultModel.collection.insertOne({ marker: "keep-me-too" });

    await seedDatabase(categories);

    expect(await GameResultModel.collection.countDocuments({ marker: "keep-me" })).toBe(1);
    expect(await DailyResultModel.collection.countDocuments({ marker: "keep-me-too" })).toBe(1);
  });
});

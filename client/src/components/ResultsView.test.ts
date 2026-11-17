import { describe, expect, it } from "vitest";
import type { Item } from "@budget-draft/shared";
import { findBestValue } from "./ResultsView";

function item(name: string, price: number, rating: number, isBench = false): Item {
  return { id: name, name, category: "t", price, rating, tag: "T", isBench };
}

describe("findBestValue", () => {
  it("picks the highest rating per dollar and ignores bench items", () => {
    const team = [item("Star", 10, 98), item("Steal", 2, 70), item("Bench Player", 0, 10, true), null];
    expect(findBestValue(team)?.name).toBe("Steal");
  });

  it("returns null for an all-bench team", () => {
    expect(findBestValue([item("Bench Player", 0, 10, true)])).toBeNull();
  });
});

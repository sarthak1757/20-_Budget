import { describe, expect, it } from "vitest";
import { shuffle } from "../shuffle";
import { toPublicState } from "../publicState";
import { makeItems, startGame } from "./helpers";

describe("toPublicState", () => {
  it("removes the item pool and reports only how many items are left", () => {
    const state = startGame({ items: makeItems(10) });
    const visible = toPublicState(state);
    expect("itemPool" in visible).toBe(false);
    expect(visible.itemsRemaining).toBe(9); // one is on the table
    // Make sure it really is gone after JSON (what Socket.io sends).
    expect(JSON.stringify(visible)).not.toContain("itemPool");
  });
});

describe("shuffle", () => {
  it("keeps every item and does not change the input", () => {
    const input = [1, 2, 3, 4, 5, 6];
    const output = shuffle(input);
    expect(input).toEqual([1, 2, 3, 4, 5, 6]);
    expect([...output].sort()).toEqual(input);
  });
});

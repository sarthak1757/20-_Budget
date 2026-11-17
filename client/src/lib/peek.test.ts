import { describe, expect, it } from "vitest";
import { isPeekVisible, type PeekedItem } from "./peek";

const peek: PeekedItem = {
  item: { id: "x", name: "Next", category: "t", price: 3, rating: 60, tag: "T" },
  playerId: "asha",
  roundNumber: 4,
};

describe("isPeekVisible", () => {
  it("shows the peek to the player who peeked, on the same item", () => {
    expect(isPeekVisible(peek, 4, "asha")).toBe(true);
  });

  it("hides it from the next player on a shared device", () => {
    expect(isPeekVisible(peek, 4, "ben")).toBe(false);
  });

  it("hides it once the next item is revealed", () => {
    expect(isPeekVisible(peek, 5, "asha")).toBe(false);
    expect(isPeekVisible(null, 4, "asha")).toBe(false);
  });
});

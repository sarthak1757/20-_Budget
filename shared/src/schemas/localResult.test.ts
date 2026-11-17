import { describe, expect, it } from "vitest";
import { localResultSchema } from "./index";

function makeResult(budgetLeft = 2) {
  const item = { name: "A", price: 6, rating: 70, tag: "T", isBench: false };
  return {
    mode: "local",
    categorySlug: "football",
    startingBudget: 20,
    slotCount: 3,
    players: [
      { id: "player-one", name: "One", isBot: false, budgetLeft, team: [item, item, item] },
      { id: "player-two", name: "Two", isBot: false, budgetLeft, team: [item, item, item] },
    ],
  };
}

describe("localResultSchema", () => {
  it("accepts a consistent result", () => {
    expect(localResultSchema.safeParse(makeResult()).success).toBe(true);
  });

  it("rejects money that doesn't add up", () => {
    const result = localResultSchema.safeParse(makeResult(5));
    expect(result.success).toBe(false);
  });

  it("rejects online mode (online results are saved by the server only)", () => {
    expect(localResultSchema.safeParse({ ...makeResult(), mode: "online" }).success).toBe(false);
  });
});

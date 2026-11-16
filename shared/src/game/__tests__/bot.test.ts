import { describe, expect, it } from "vitest";
import { decideBotAction } from "../bot";
import { makeItem, makeItems, startGame } from "./helpers";

function gameWithFirstItem(price: number, rating: number, extraItems = 30) {
  const items = [makeItem("first", price, rating), ...makeItems(extraItems)];
  return startGame({ mode: "bot", botIds: ["p1"], items });
}

describe("decideBotAction", () => {
  it("buys good value items (rating/price >= threshold)", () => {
    expect(decideBotAction(gameWithFirstItem(5, 70), "p1")).toBe("buy"); // ratio 14
  });

  it("passes on poor value items", () => {
    expect(decideBotAction(gameWithFirstItem(8, 70), "p1")).toBe("pass"); // ratio 8.75
  });

  it("passes when the budget rule blocks the buy", () => {
    // A great deal ($2 for rating 99), but with $3 and 3 empty slots the bot may only spend $1.
    const state = gameWithFirstItem(2, 99);
    const bot = state.players[0];
    if (bot) {
      bot.budget = 3;
    }
    expect(decideBotAction(state, "p1")).toBe("pass");
  });

  it("buys anything affordable when items are running out", () => {
    // 2 players x 3 slots = 6 empty slots, only 4 items in total.
    expect(decideBotAction(gameWithFirstItem(8, 40, 3), "p1")).toBe("buy");
  });
});

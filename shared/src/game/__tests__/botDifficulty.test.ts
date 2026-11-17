import { describe, expect, it } from "vitest";
import { decideBotMoveAt } from "../bot";
import { makeBotView } from "../bots/view";
import { buildPlanTable, planValue } from "../bots/planning";
import { playBotGame, seatZeroWinRate, winRate } from "./simulate";
import { makeItem, makeItems, startGame } from "./helpers";

// 200 seeded games on the real seed categories, seats swapping every game.
const GAMES = 200;

describe("bot difficulty (simulated)", () => {
  it("hard beats easy in at least 70% of games, in Classic and in Auction", () => {
    expect(winRate("hard", "easy", "classic", GAMES)).toBeGreaterThanOrEqual(0.7);
    expect(winRate("hard", "easy", "auction", GAMES)).toBeGreaterThanOrEqual(0.7);
  });

  it("is fair to both seats: easy vs easy is close to 50%", () => {
    const classic = seatZeroWinRate("easy", "classic", GAMES);
    const auction = seatZeroWinRate("easy", "auction", GAMES);
    expect(classic).toBeGreaterThanOrEqual(0.4);
    expect(classic).toBeLessThanOrEqual(0.6);
    expect(auction).toBeGreaterThanOrEqual(0.4);
    expect(auction).toBeLessThanOrEqual(0.6);
  });

  it("ranks the levels: medium beats easy, hard beats medium", () => {
    expect(winRate("medium", "easy", "classic", GAMES)).toBeGreaterThan(0.5);
    expect(winRate("hard", "medium", "classic", GAMES)).toBeGreaterThan(0.5);
  });

  it("never makes an illegal move, with every extra on and 4 bots", () => {
    // playBotGame throws if a bot's move is rejected by the engine.
    for (let seed = 0; seed < 20; seed++) {
      const scores = playBotGame({
        seats: ["easy", "medium", "hard", "hard"],
        draftStyle: seed % 2 === 0 ? "classic" : "auction",
        seed,
        extras: { balancedTeam: true, mysteryItems: true, slotCount: 6 },
      });
      expect(scores).toHaveLength(4);
    }
  });
});

describe("bots play fair", () => {
  it("the bot view has no item order and no hidden ratings", () => {
    const mystery = { ...makeItem("m", 3, 99), isMystery: true };
    const state = startGame({ items: [mystery, makeItem("b", 2, 40), makeItem("c", 9, 95)] });
    const view = makeBotView(state, "p1");
    expect(view.game.currentItem?.rating).toBeNull();
    expect("itemPool" in view.game).toBe(false);
    // Unseen items are sorted by rating, not in pile order (pile order is b, c).
    expect(view.unseen.map((item) => item.rating)).toEqual([40, 95]);
  });
});

describe("medium", () => {
  it("pays for a star well above the average still to come", () => {
    // $9 for rating 96, when the rest of the pile averages 50: Easy passes, Medium buys.
    const state = startGame({ items: [makeItem("star", 9, 96), ...makeItems(30, 2, 50)], botIds: ["p1"] });
    expect(decideBotMoveAt(state, "p1", "easy")).toEqual({ type: "pass" });
    expect(decideBotMoveAt(state, "p1", "medium")).toEqual({ type: "buy" });
  });
});

describe("hard", () => {
  it("plans: the best 2 picks from a small pool within the budget", () => {
    const pool = [
      { rating: 90, price: 9, tag: "T" }, // value 81
      { rating: 70, price: 4, tag: "T" }, // value 66
      { rating: 60, price: 2, tag: "T" }, // value 58
    ];
    const table = buildPlanTable(pool, 4, 100);
    expect(planValue(table, 2, 10)).toBe(66 + 58); // 9 + 4 is over $10
    expect(planValue(table, 2, 13)).toBe(81 + 66);
    // Not enough items: the rest are bench players (rating 10, free).
    expect(planValue(table, 4, 100)).toBe(81 + 66 + 58 + 10);
  });

  it("bids up to what the item is worth, then stops", () => {
    const state = startGame({
      items: [makeItem("x", 5, 80), ...makeItems(30, 3, 55)],
      settings: { draftStyle: "auction" },
      botIds: ["p1"],
    });
    expect(decideBotMoveAt(state, "p1", "hard")).toEqual({ type: "bid", amount: 1 });
    // Someone has bid $15 already: far more than an 80 is worth with 3 slots to fill.
    const outbid = { ...state, auction: { highBid: 15, highBidderId: "p2" } };
    expect(decideBotMoveAt(outbid, "p1", "hard")).toEqual({ type: "pass" });
  });

  it("values a role it still needs for the balanced bonus", () => {
    const keeper = { ...makeItem("gk", 4, 62), tag: "GK" };
    const outfield = { ...makeItem("out", 4, 62), tag: "OUT" };
    const pile = makeItems(30, 3, 66).map((item) => ({ ...item, tag: "OUT" }));
    const settings = { balancedTeam: true, slotCount: 3 };
    const roles = ["GK", "OUT"];
    const withKeeper = startGame({ items: [keeper, ...pile], settings, roles, botIds: ["p1"] });
    const withOutfield = startGame({ items: [outfield, ...pile], settings, roles, botIds: ["p1"] });
    // The bot already has an outfielder, so only the keeper role is missing.
    for (const state of [withKeeper, withOutfield]) {
      const bot = state.players[0];
      if (bot) bot.team[0] = { ...makeItem("mine", 3, 66), tag: "OUT" };
    }
    // Same rating and price; only the keeper fills the missing role.
    expect(decideBotMoveAt(withKeeper, "p1", "hard")).toEqual({ type: "buy" });
    expect(decideBotMoveAt(withOutfield, "p1", "hard")).toEqual({ type: "pass" });
  });
});

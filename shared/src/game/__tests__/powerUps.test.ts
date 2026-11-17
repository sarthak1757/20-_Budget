import { describe, expect, it } from "vitest";
import type { GameState } from "../../types/game";
import { applyAction, peekNextItem, type EngineResult } from "../engine";
import { discountedPrice, getPowerUpBlockReason } from "../powerUps";
import { toPublicState } from "../publicState";
import { makeItem, makeItems, NOW, startGame } from "./helpers";

function expectOk(result: EngineResult): GameState {
  if (!result.ok) {
    throw new Error(`Expected ok, got error: ${result.error}`);
  }
  return result.state;
}

function powerUpGame(options: { draftStyle?: "classic" | "auction"; items?: ReturnType<typeof makeItems> } = {}) {
  return startGame({
    settings: { powerUps: true, draftStyle: options.draftStyle ?? "classic" },
    items: options.items ?? makeItems(30),
  });
}

describe("power-ups are off by default", () => {
  it("rejects every power-up when the extra is off", () => {
    const result = applyAction(startGame(), { type: "veto", playerId: "p1" }, NOW);
    expect(result).toEqual({ ok: false, error: "Power-ups are off in this game" });
  });
});

describe("Veto", () => {
  it("discards the current item, moves to the next one and can't be used twice", () => {
    let state = expectOk(applyAction(powerUpGame(), { type: "veto", playerId: "p1" }, NOW));
    expect(state.lastEvents[0]).toMatchObject({ type: "vetoed", playerId: "p1", item: { id: "i1" } });
    expect(state.currentItem?.id).toBe("i2");
    expect(state.players[0]?.usedPowerUps).toEqual(["veto"]);

    // Two rounds later it's p1's turn again (seats rotate), but the veto is gone.
    state = expectOk(applyAction(state, { type: "pass", playerId: "p2" }, NOW));
    state = expectOk(applyAction(state, { type: "pass", playerId: "p1" }, NOW));
    expect(state.turnQueue[0]).toBe("p1");
    expect(applyAction(state, { type: "veto", playerId: "p1" }, NOW)).toEqual({
      ok: false,
      error: "You've already used that one",
    });
  });

  it("only works on your own turn", () => {
    expect(getPowerUpBlockReason(powerUpGame(), "p2", "veto", 10)).toBe("Power-ups can only be used on your turn");
  });

  it("is too late in an auction once someone has bid", () => {
    let state = powerUpGame({ draftStyle: "auction" });
    state = expectOk(applyAction(state, { type: "bid", playerId: "p1", amount: 1 }, NOW));
    expect(applyAction(state, { type: "veto", playerId: "p2" }, NOW)).toEqual({
      ok: false,
      error: "Too late: someone has already bid",
    });
  });
});

describe("Discount", () => {
  it("buys the current item for $2 less, never below $1", () => {
    expect(discountedPrice(5)).toBe(3);
    expect(discountedPrice(2)).toBe(1);
    expect(discountedPrice(1)).toBe(1);

    const state = expectOk(
      applyAction(powerUpGame({ items: [makeItem("x", 6, 80), ...makeItems(10)] }), { type: "discount", playerId: "p1" }, NOW),
    );
    expect(state.players[0]?.budget).toBe(16);
    expect(state.players[0]?.team[0]?.id).toBe("x");
    expect(state.lastEvents[0]).toMatchObject({ type: "bought", price: 4 });
  });

  it("is Classic only", () => {
    const state = powerUpGame({ draftStyle: "auction" });
    expect(applyAction(state, { type: "discount", playerId: "p1" }, NOW)).toEqual({
      ok: false,
      error: "Discount is only for Classic games",
    });
  });

  it("still asks a player who can only afford the item with their Discount", () => {
    // p2 spends $14 first: $6 left with 2 empty slots, so they may spend $5.
    const items = [makeItem("big", 14, 90), makeItem("x", 6, 80), ...makeItems(10)];
    let state = powerUpGame({ items });
    state = expectOk(applyAction(state, { type: "pass", playerId: "p1" }, NOW));
    state = expectOk(applyAction(state, { type: "buy", playerId: "p2" }, NOW));

    // $6 is over their limit, but $4 with Discount isn't, so p2 is still in the queue.
    expect(state.currentItem?.id).toBe("x");
    expect(state.turnQueue).toContain("p2");
    expect(state.cantAffordIds).not.toContain("p2");
    while (state.turnQueue[0] !== "p2") {
      state = expectOk(applyAction(state, { type: "pass", playerId: state.turnQueue[0] ?? "" }, NOW));
    }
    expect(applyAction(state, { type: "buy", playerId: "p2" }, NOW).ok).toBe(false);
    const discounted = expectOk(applyAction(state, { type: "discount", playerId: "p2" }, NOW));
    expect(discounted.players[1]?.budget).toBe(2);
  });
});

describe("Peek", () => {
  it("returns the next item to the caller and records only that a peek happened", () => {
    const state = powerUpGame();
    const result = peekNextItem(state, "p1");
    if (!result.ok) throw new Error(result.error);
    expect(result.nextItem.id).toBe("i2");
    expect(result.state.players[0]?.usedPowerUps).toEqual(["peek"]);
    expect(result.state.lastEvents).toEqual([{ type: "peeked", playerId: "p1" }]);
    // The turn doesn't move on, and the broadcast state never names the peeked item.
    expect(result.state.turnQueue[0]).toBe("p1");
    expect(JSON.stringify(toPublicState(result.state))).not.toContain('"i2"');
  });

  it("can't be used when the pile is empty, or twice", () => {
    const lastItem = powerUpGame({ items: makeItems(1) });
    expect(peekNextItem(lastItem, "p1")).toEqual({ ok: false, error: "There are no more items to peek at" });

    const once = peekNextItem(powerUpGame(), "p1");
    if (!once.ok) throw new Error(once.error);
    expect(peekNextItem(once.state, "p1")).toEqual({ ok: false, error: "You've already used that one" });
  });
});

import { describe, expect, it } from "vitest";
import type { GameState } from "../../types/game";
import { getBidBlockReason, minimumBid } from "../auction";
import { applyAction, getCurrentPlayerId, type EngineResult } from "../engine";
import { makeItem, makePlayer, NOW, startGame } from "./helpers";

function expectOk(result: EngineResult): GameState {
  if (!result.ok) {
    throw new Error(`Expected ok, got error: ${result.error}`);
  }
  return result.state;
}

function bid(state: GameState, playerId: string, amount: number): GameState {
  return expectOk(applyAction(state, { type: "bid", playerId, amount }, NOW));
}

function pass(state: GameState, playerId: string): GameState {
  return expectOk(applyAction(state, { type: "pass", playerId }, NOW));
}

function auctionGame(playerCount = 3) {
  return startGame({ playerCount, settings: { draftStyle: "auction" } });
}

describe("auction: opening", () => {
  it("starts every item with no bids and a $1 minimum", () => {
    const state = auctionGame();
    expect(state.auction).toEqual({ highBid: 0, highBidderId: null });
    expect(minimumBid(state.auction ?? { highBid: 0, highBidderId: null })).toBe(1);
    expect(state.turnQueue).toEqual(["p1", "p2", "p3"]);
  });

  it("rejects BUY in an auction and BID in classic", () => {
    expect(applyAction(auctionGame(), { type: "buy", playerId: "p1" }, NOW).ok).toBe(false);
    expect(applyAction(startGame(), { type: "bid", playerId: "p1", amount: 3 }, NOW)).toEqual({
      ok: false,
      error: "Bidding is only for auction games",
    });
  });
});

describe("auction: bidding", () => {
  it("moves the bidder to the back so everyone else answers first", () => {
    const state = bid(auctionGame(), "p1", 2);
    expect(state.auction).toEqual({ highBid: 2, highBidderId: "p1" });
    expect(state.turnQueue).toEqual(["p2", "p3", "p1"]);
    expect(state.lastEvents[0]).toMatchObject({ type: "bid", playerId: "p1", amount: 2 });
  });

  it("requires at least $1 more than the high bid", () => {
    const state = bid(auctionGame(), "p1", 3);
    expect(applyAction(state, { type: "bid", playerId: "p2", amount: 3 }, NOW)).toEqual({
      ok: false,
      error: "The bid must be at least $4",
    });
    expect(bid(state, "p2", 4).auction?.highBidderId).toBe("p2");
  });

  it("enforces the budget rule on bids", () => {
    // $20 with 3 empty slots: the most you can bid is $18.
    const state = auctionGame();
    expect(applyAction(state, { type: "bid", playerId: "p1", amount: 19 }, NOW).ok).toBe(false);
    // Nobody else can afford $19, so the $18 bid wins straight away.
    const after = bid(state, "p1", 18);
    expect(after.players[0]?.budget).toBe(2);
    expect(after.cantAffordIds).toEqual([]); // reset for the next item
  });

  it("rejects bids that aren't whole dollars", () => {
    const player = makePlayer();
    expect(getBidBlockReason(player, { highBid: 0, highBidderId: null }, 2.5)).toBe("Bids are whole dollars");
  });
});

describe("auction: winning and discarding", () => {
  it("gives the item to the high bidder at their bid once everyone else passes", () => {
    let state = auctionGame();
    state = bid(state, "p1", 2);
    state = bid(state, "p2", 5);
    state = pass(state, "p3");
    state = pass(state, "p1");

    const winner = state.players.find((p) => p.id === "p2");
    expect(winner?.budget).toBe(15);
    expect(winner?.team[0]?.id).toBe("i1");
    expect(state.lastEvents).toContainEqual(expect.objectContaining({ type: "bought", playerId: "p2", price: 5 }));
    // Next item, fresh auction, first seat rotated.
    expect(state.currentItem?.id).toBe("i2");
    expect(state.auction).toEqual({ highBid: 0, highBidderId: null });
    expect(getCurrentPlayerId(state)).toBe("p2");
  });

  it("lets a passed player stay out: they aren't asked again for this item", () => {
    let state = auctionGame();
    state = pass(state, "p1");
    state = bid(state, "p2", 1);
    state = bid(state, "p3", 2);
    // p1 passed, so it's straight back to p2.
    expect(state.turnQueue).toEqual(["p2", "p3"]);
  });

  it("discards the item when everyone passes without bidding", () => {
    let state = auctionGame(2);
    state = pass(state, "p1");
    state = pass(state, "p2");
    expect(state.lastEvents).toContainEqual(expect.objectContaining({ type: "discarded" }));
    expect(state.currentItem?.id).toBe("i2");
  });

  it("skips a player who can't afford the next bid", () => {
    // p2 has $3 and 3 empty slots, so can spend $1 at most.
    let state = auctionGame();
    state = {
      ...state,
      players: state.players.map((p) => (p.id === "p2" ? { ...p, budget: 3 } : p)),
    };
    state = bid(state, "p1", 2);
    expect(state.turnQueue).toEqual(["p3", "p1"]);
    expect(state.cantAffordIds).toContain("p2");
  });

  it("ends the round when the last bidder standing is the high bidder", () => {
    let state = auctionGame(2);
    state = pass(state, "p1");
    state = bid(state, "p2", 1);
    expect(state.players[1]?.team[0]?.id).toBe("i1");
    expect(state.players[1]?.budget).toBe(19);
  });

  it("can auction an item for less than its listed price", () => {
    let state = startGame({
      playerCount: 2,
      settings: { draftStyle: "auction" },
      items: [makeItem("star", 9, 95), makeItem("b", 1, 40), makeItem("c", 1, 40), makeItem("d", 1, 40)],
    });
    state = bid(state, "p1", 1);
    state = pass(state, "p2");
    expect(state.players[0]?.team[0]?.id).toBe("star");
    expect(state.players[0]?.budget).toBe(19);
  });
});

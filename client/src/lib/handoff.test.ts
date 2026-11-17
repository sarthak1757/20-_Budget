import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS, applyAction, castVote, createGame, type GameState } from "@budget-draft/shared";
import { needsHandoff, whoNeedsDevice } from "./handoff";

function makeItems(count: number) {
  const items = [];
  for (let i = 0; i < count; i++) {
    items.push({ id: `i${i}`, name: `Item ${i}`, category: "t", price: 1, rating: 50, tag: "T" });
  }
  return items;
}

function newGame(playerCount: number, botIds: string[] = []): GameState {
  const players = [];
  for (let i = 1; i <= playerCount; i++) {
    players.push({ id: `p${i}`, name: `P${i}`, isBot: botIds.includes(`p${i}`) });
  }
  return createGame({
    mode: botIds.length > 0 ? "bot" : "local",
    settings: { ...DEFAULT_SETTINGS, startingBudget: 10, slotCount: 3, turnSeconds: 0, voteSeconds: 0, categorySlug: "t" },
    players,
    items: makeItems(20),
    now: 0,
    random: () => 0.999999, // keep pool order
  });
}

function mustOk(result: ReturnType<typeof applyAction>): GameState {
  if (!result.ok) throw new Error(result.error);
  return result.state;
}

describe("handoff", () => {
  it("asks for the device at the start and after the turn moves on", () => {
    let state = newGame(2);
    expect(whoNeedsDevice(state)).toBe("p1");
    expect(needsHandoff(state, null)).toBe(true);
    expect(needsHandoff(state, "p1")).toBe(false);

    state = mustOk(applyAction(state, { type: "pass", playerId: "p1" }, 0));
    expect(needsHandoff(state, "p1")).toBe(true);
    expect(whoNeedsDevice(state)).toBe("p2");
  });

  it("never asks with a single human (bot mode)", () => {
    const state = newGame(2, ["p2"]);
    expect(needsHandoff(state, null)).toBe(false);
  });

  it("walks through voters one by one", () => {
    let state = newGame(3);
    while (state.phase === "drafting") {
      state = mustOk(applyAction(state, { type: "buy", playerId: state.turnQueue[0] ?? "" }, 0));
    }
    expect(whoNeedsDevice(state)).toBe("p1");
    state = mustOk(castVote(state, "p1", "p2", 0));
    expect(whoNeedsDevice(state)).toBe("p2");
  });
});

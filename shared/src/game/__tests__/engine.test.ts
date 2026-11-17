import { describe, expect, it } from "vitest";
import type { GameState } from "../../types/game";
import { ONLINE_VOTE_SECONDS } from "../constants";
import { applyAction, castVote, createGame, endVoting, getCurrentPlayerId, type EngineResult } from "../engine";
import { makeItem, makeItems, makePlayers, makeSettings, noShuffle, NOW, startGame } from "./helpers";

// Unwraps a successful result so tests read cleanly; fails loudly otherwise.
function expectOk(result: EngineResult): GameState {
  if (!result.ok) {
    throw new Error(`Expected ok, got error: ${result.error}`);
  }
  return result.state;
}

function buy(state: GameState, playerId: string): GameState {
  return expectOk(applyAction(state, { type: "buy", playerId }, NOW));
}

function pass(state: GameState, playerId: string): GameState {
  return expectOk(applyAction(state, { type: "pass", playerId }, NOW));
}

describe("createGame", () => {
  it("starts drafting with the first item revealed and player 1 first", () => {
    const state = startGame();
    expect(state.phase).toBe("drafting");
    expect(state.roundNumber).toBe(1);
    expect(state.currentItem?.id).toBe("i1");
    expect(state.turnQueue).toEqual(["p1", "p2"]);
    expect(state.players[0]?.budget).toBe(20);
    expect(state.players[0]?.team).toEqual([null, null, null]);
  });

  it("rejects too few players and impossible budgets", () => {
    const base = { mode: "local" as const, items: makeItems(5), now: NOW, random: noShuffle };
    expect(() => createGame({ ...base, settings: makeSettings(), players: makePlayers(1) })).toThrow();
    expect(() =>
      createGame({ ...base, settings: makeSettings({ startingBudget: 2, slotCount: 3 }), players: makePlayers(2) }),
    ).toThrow();
  });

  it("sets a turn deadline only when there is a timer", () => {
    expect(startGame().turnDeadline).toBeNull();
    expect(startGame({ settings: { turnSeconds: 15 } }).turnDeadline).toBe(NOW + 15_000);
  });
});

describe("applyAction: turns", () => {
  it("rejects an action from a player whose turn it isn't", () => {
    const result = applyAction(startGame(), { type: "buy", playerId: "p2" }, NOW);
    expect(result).toEqual({ ok: false, error: "It's not your turn" });
  });

  it("does not change the state it was given", () => {
    const state = startGame();
    const before = structuredClone(state);
    buy(state, "p1");
    expect(state).toEqual(before);
  });

  it("passing hands the item to the next player", () => {
    const state = pass(startGame(), "p1");
    expect(state.currentItem?.id).toBe("i1");
    expect(getCurrentPlayerId(state)).toBe("p2");
  });

  it("restarts the turn timer for the next player after a pass", () => {
    const state = startGame({ settings: { turnSeconds: 15 } });
    const later = NOW + 5_000;
    const next = expectOk(applyAction(state, { type: "pass", playerId: "p1" }, later));
    expect(next.turnDeadline).toBe(later + 15_000);
  });

  it("marks auto-passes from timeouts", () => {
    const next = expectOk(applyAction(startGame(), { type: "pass", playerId: "p1", auto: true }, NOW));
    expect(next.lastEvents).toEqual([{ type: "passed", playerId: "p1", item: makeItem("i1", 2, 50), auto: true }]);
  });

  it("discards the item when everyone passes and reveals the next", () => {
    let state = pass(startGame(), "p1");
    state = pass(state, "p2");
    expect(state.lastEvents.map((e) => e.type)).toEqual(["passed", "discarded"]);
    expect(state.currentItem?.id).toBe("i2");
    expect(state.roundNumber).toBe(2);
  });

  it("rotates who goes first each round", () => {
    let state = startGame({ playerCount: 3 });
    expect(state.turnQueue).toEqual(["p1", "p2", "p3"]);
    state = buy(state, "p1");
    expect(state.turnQueue).toEqual(["p2", "p3", "p1"]);
    state = buy(state, "p2");
    expect(state.turnQueue).toEqual(["p3", "p1", "p2"]);
  });
});

describe("applyAction: buying", () => {
  it("puts the item in the first empty slot and takes the money", () => {
    const state = buy(startGame(), "p1");
    const p1 = state.players[0];
    expect(p1?.team[0]?.id).toBe("i1");
    expect(p1?.budget).toBe(18);
    expect(state.lastEvents[0]).toMatchObject({ type: "bought", playerId: "p1" });
    expect(state.currentItem?.id).toBe("i2");
  });

  it("only one player can buy each item", () => {
    const state = buy(startGame(), "p1");
    // The round moved on: p2 is now first, and the item on the table is i2, not i1.
    expect(state.currentItem?.id).toBe("i2");
    expect(state.players[1]?.team).toEqual([null, null, null]);
  });

  it("skips players who can't afford the item under the budget rule", () => {
    // $10 with 3 slots: max spend on the first item is $8.
    const items = [makeItem("cheap", 2, 50), makeItem("pricey", 9, 95), ...makeItems(10)];
    let state = startGame({ items, settings: { startingBudget: 10 } });
    state = pass(state, "p1");
    state = pass(state, "p2"); // "cheap" discarded, then "pricey" revealed...
    // ...but nobody can afford "pricey", so it is discarded at once and i1 comes up.
    expect(state.lastEvents.map((e) => e.type)).toEqual(["passed", "discarded", "discarded"]);
    expect(state.lastEvents[2]).toMatchObject({ type: "discarded", item: { id: "pricey" } });
    expect(state.currentItem?.id).toBe("i1");
  });

  it("records players who were skipped for budget reasons", () => {
    // p1 spends down so the next item is out of reach for them only.
    const items = [makeItem("a", 8, 90), makeItem("b", 5, 60), ...makeItems(10)];
    let state = startGame({ items, settings: { startingBudget: 10 } });
    state = buy(state, "p1"); // p1 has $2 for 2 slots -> max spend $1
    expect(state.currentItem?.id).toBe("b");
    expect(state.turnQueue).toEqual(["p2"]);
    expect(state.cantAffordIds).toEqual(["p1"]);
  });
});

describe("end of the draft", () => {
  function fillAllSlots(state: GameState): GameState {
    let current = state;
    while (current.phase === "drafting") {
      const playerId = getCurrentPlayerId(current);
      if (playerId === null) {
        throw new Error("No current player while drafting");
      }
      current = buy(current, playerId);
    }
    return current;
  }

  it("ends with results straight away for 2 players (no vote)", () => {
    const state = fillAllSlots(startGame());
    expect(state.phase).toBe("finished");
    expect(state.voteDeadline).toBeNull();
    for (const player of state.players) {
      expect(player.team.every((slot) => slot !== null)).toBe(true);
    }
  });

  it("skips voting in bot mode", () => {
    const state = fillAllSlots(startGame({ mode: "bot", botIds: ["p2"] }));
    expect(state.phase).toBe("finished");
  });

  it("opens a 30s vote with 3+ human players", () => {
    const state = fillAllSlots(startGame({ playerCount: 3 }));
    expect(state.phase).toBe("voting");
    expect(state.voteDeadline).toBe(NOW + ONLINE_VOTE_SECONDS * 1000);
  });

  it("has no vote deadline when voteSeconds is 0 (pass-and-play)", () => {
    const state = fillAllSlots(startGame({ playerCount: 3, settings: { voteSeconds: 0 } }));
    expect(state.phase).toBe("voting");
    expect(state.voteDeadline).toBeNull();
    // A vote much later is still accepted.
    expect(castVote(state, "p1", "p2", NOW + 10 * 60_000).ok).toBe(true);
  });

  it("does not hold a vote with 2 humans and 1 bot", () => {
    const state = fillAllSlots(startGame({ playerCount: 3, botIds: ["p3"] }));
    expect(state.phase).toBe("finished");
  });

  it("fills empty slots with $0 bench items when the pool runs out", () => {
    let state = startGame({ items: makeItems(2) });
    state = buy(state, "p1");
    state = pass(state, "p2");
    state = pass(state, "p1");
    expect(state.phase).toBe("finished");
    const p1Team = state.players[0]?.team ?? [];
    expect(p1Team[0]?.id).toBe("i1");
    expect(p1Team[1]).toMatchObject({ price: 0, rating: 10, isBench: true });
    expect(state.players[1]?.team.every((slot) => slot?.isBench === true)).toBe(true);
    expect(state.players[0]?.budget).toBe(18); // bench items are free
  });

  it("rejects actions once the draft is over", () => {
    const state = fillAllSlots(startGame());
    expect(applyAction(state, { type: "pass", playerId: "p1" }, NOW).ok).toBe(false);
  });
});

describe("voting", () => {
  function votingGame(): GameState {
    let state = startGame({ playerCount: 3, settings: { slotCount: 3 } });
    while (state.phase === "drafting") {
      state = buy(state, getCurrentPlayerId(state) ?? "");
    }
    return state;
  }

  it("rejects self-votes and unknown targets", () => {
    const state = votingGame();
    expect(castVote(state, "p1", "p1", NOW)).toEqual({ ok: false, error: "You can't vote for yourself" });
    expect(castVote(state, "p1", "nobody", NOW).ok).toBe(false);
  });

  it("rejects votes after the deadline", () => {
    const state = votingGame();
    const late = (state.voteDeadline ?? 0) + 1;
    expect(castVote(state, "p1", "p2", late)).toEqual({ ok: false, error: "Voting has closed" });
  });

  it("lets a player change their vote", () => {
    let state = votingGame();
    state = expectOk(castVote(state, "p1", "p2", NOW));
    state = expectOk(castVote(state, "p1", "p3", NOW));
    expect(state.votes).toEqual({ p1: "p3" });
    expect(state.phase).toBe("voting");
  });

  it("finishes early once every human has voted", () => {
    let state = votingGame();
    state = expectOk(castVote(state, "p1", "p2", NOW));
    state = expectOk(castVote(state, "p2", "p1", NOW));
    state = expectOk(castVote(state, "p3", "p1", NOW));
    expect(state.phase).toBe("finished");
  });

  it("endVoting closes the vote when the timer runs out", () => {
    const state = endVoting(votingGame());
    expect(state.phase).toBe("finished");
    expect(castVote(state, "p1", "p2", NOW).ok).toBe(false);
  });
});

describe("createGame: mystery items", () => {
  // Alternates "keep order" (for the shuffle) with low/high rolls for the mystery check.
  function scriptedRandom(values: number[]): () => number {
    let index = 0;
    return () => {
      const value = values[index % values.length] ?? 0.999999;
      index += 1;
      return value;
    };
  }

  it("marks items whose roll is under 1 in 6, only when the setting is on", () => {
    const items = makeItems(4);
    // 3 shuffle swaps, then one roll per item.
    const rolls = [0.999999, 0.999999, 0.999999, 0.1, 0.9, 0.05, 0.5];
    const base = { mode: "local" as const, items, players: makePlayers(2), now: NOW };
    const on = createGame({ ...base, settings: makeSettings({ mysteryItems: true }), random: scriptedRandom(rolls) });
    const mysteryIds = [on.currentItem, ...on.itemPool].filter((item) => item?.isMystery).map((item) => item?.id);
    expect(mysteryIds).toEqual(["i1", "i3"]);

    const off = createGame({ ...base, settings: makeSettings(), random: scriptedRandom(rolls) });
    expect([off.currentItem, ...off.itemPool].some((item) => item?.isMystery)).toBe(false);
  });
});

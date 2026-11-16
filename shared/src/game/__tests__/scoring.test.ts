import { describe, expect, it } from "vitest";
import type { GameState } from "../../types/game";
import { computeResults, scoreTeam, tallyVotes } from "../scoring";
import { makeItem, makePlayer, startGame } from "./helpers";

describe("scoreTeam", () => {
  it("adds ratings plus $1 = 1 point for leftover money", () => {
    const player = makePlayer({
      budget: 3,
      team: [makeItem("a", 5, 80), makeItem("b", 4, 60), null],
    });
    expect(scoreTeam(player)).toEqual({ ratingTotal: 140, leftoverBonus: 3, total: 143 });
  });
});

describe("tallyVotes", () => {
  it("counts votes per player", () => {
    expect(tallyVotes({ p1: "p2", p2: "p1", p3: "p2" })).toEqual({ p2: 2, p1: 1 });
  });
});

describe("computeResults", () => {
  function withTeams(state: GameState, totals: number[]): GameState {
    const next = structuredClone(state);
    for (let i = 0; i < next.players.length; i++) {
      const player = next.players[i];
      if (player) {
        player.budget = 0;
        player.team = [makeItem(`x${i}`, 1, totals[i] ?? 0)];
      }
    }
    return next;
  }

  it("ranks by total and reports the stats winner", () => {
    const state = withTeams(startGame(), [100, 150]);
    const results = computeResults(state);
    expect(results.scores.map((s) => s.playerId)).toEqual(["p2", "p1"]);
    expect(results.statsWinnerIds).toEqual(["p2"]);
    expect(results.votingHeld).toBe(false);
    expect(results.voteWinnerIds).toEqual([]);
  });

  it("tied players share the win", () => {
    const results = computeResults(withTeams(startGame(), [120, 120]));
    expect(results.statsWinnerIds.sort()).toEqual(["p1", "p2"]);
  });

  it("reports the vote winner separately from the stats winner", () => {
    const state = withTeams(startGame({ playerCount: 3 }), [200, 100, 50]);
    state.votes = { p1: "p3", p2: "p3", p3: "p1" };
    const results = computeResults(state);
    expect(results.statsWinnerIds).toEqual(["p1"]);
    expect(results.voteWinnerIds).toEqual(["p3"]);
    expect(results.scores.find((s) => s.playerId === "p3")?.votesReceived).toBe(2);
  });

  it("has no vote winner if nobody voted", () => {
    const results = computeResults(withTeams(startGame({ playerCount: 3 }), [1, 2, 3]));
    expect(results.votingHeld).toBe(true);
    expect(results.voteWinnerIds).toEqual([]);
  });
});

import { describe, expect, it } from "vitest";
import type { GameResults, PublicPlayerState } from "@budget-draft/shared";
import { buildResultsShareText } from "./shareResults";

function player(id: string, name: string): PublicPlayerState {
  return { id, name, isBot: false, isConnected: true, budget: 0, team: [], usedPowerUps: [] };
}

function results(totals: [string, number][], winners: string[]): GameResults {
  return {
    scores: totals.map(([playerId, total]) => ({
      playerId,
      name: playerId,
      total,
      ratingTotal: total,
      leftoverBonus: 0,
      roleBonus: 0,
      votesReceived: 0,
    })),
    statsWinnerIds: winners,
    voteWinnerIds: [],
    votingHeld: false,
  };
}

describe("buildResultsShareText", () => {
  const players = [player("a", "Asha"), player("b", "Ben"), player("c", "Chen")];

  it("names the winner and lists everyone else", () => {
    const text = buildResultsShareText(players, results([["a", 415], ["b", 397], ["c", 380]], ["a"]));
    expect(text).toBe("Budget Draft: Asha won with 415 pts · Ben 397 · Chen 380");
  });

  it("says tied when winners share the top score", () => {
    const text = buildResultsShareText(players, results([["a", 400], ["b", 400], ["c", 380]], ["a", "b"]));
    expect(text).toBe("Budget Draft: Asha & Ben tied with 400 pts · Chen 380");
  });
});

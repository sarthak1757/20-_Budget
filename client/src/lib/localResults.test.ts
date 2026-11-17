import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS, applyAction, createGame, localResultSchema, type GameState } from "@budget-draft/shared";
import { buildLocalResultPayload } from "./localResults";

function finishedGame(draftStyle: "classic" | "auction" = "classic"): GameState {
  const items = [];
  for (let i = 0; i < 10; i++) {
    items.push({ id: `i${i}`, name: `Item ${i}`, category: "football", price: 3, rating: 60, tag: "T" });
  }
  let game = createGame({
    mode: "bot",
    settings: { ...DEFAULT_SETTINGS, draftStyle, startingBudget: 20, slotCount: 3, turnSeconds: 0, voteSeconds: 0, categorySlug: "football" },
    players: [
      { id: "human-player", name: "Sam", isBot: false },
      { id: "bot-player-1", name: "RoboScout", isBot: true },
    ],
    items,
    now: 0,
  });
  while (game.phase === "drafting") {
    const playerId = game.turnQueue[0] ?? "";
    // In an auction, open at $1 (well under the $3 list price); the other player then passes.
    const move = draftStyle === "auction" ? auctionMove(game) : { type: "buy" as const };
    const result = applyAction(game, { ...move, playerId }, 0);
    if (!result.ok) throw new Error(result.error);
    game = result.state;
  }
  return game;
}

function auctionMove(game: GameState): { type: "bid"; amount: number } | { type: "pass" } {
  if (game.auction?.highBidderId === null) {
    return { type: "bid", amount: 1 };
  }
  return { type: "pass" };
}

describe("buildLocalResultPayload", () => {
  it("produces a payload the server schema accepts", () => {
    const payload = buildLocalResultPayload(finishedGame());
    expect(payload).not.toBeNull();
    expect(localResultSchema.safeParse(payload).success).toBe(true);
  });

  it("sends the price actually paid, so an auction game adds up", () => {
    const payload = buildLocalResultPayload(finishedGame("auction"));
    expect(payload?.players[0]?.team[0]?.price).toBe(1);
    expect(localResultSchema.safeParse(payload).success).toBe(true);
  });

  it("returns null for unfinished games", () => {
    const game = { ...finishedGame(), phase: "drafting" as const };
    expect(buildLocalResultPayload(game)).toBeNull();
  });
});

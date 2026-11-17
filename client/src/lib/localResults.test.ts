import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS, applyAction, createGame, localResultSchema, type GameState } from "@budget-draft/shared";
import { buildLocalResultPayload } from "./localResults";

function finishedGame(): GameState {
  const items = [];
  for (let i = 0; i < 10; i++) {
    items.push({ id: `i${i}`, name: `Item ${i}`, category: "football", price: 3, rating: 60, tag: "T" });
  }
  let game = createGame({
    mode: "bot",
    settings: { ...DEFAULT_SETTINGS, startingBudget: 20, slotCount: 3, turnSeconds: 0, voteSeconds: 0, categorySlug: "football" },
    players: [
      { id: "human-player", name: "Sam", isBot: false },
      { id: "bot-player-1", name: "RoboScout", isBot: true },
    ],
    items,
    now: 0,
  });
  while (game.phase === "drafting") {
    const result = applyAction(game, { type: "buy", playerId: game.turnQueue[0] ?? "" }, 0);
    if (!result.ok) throw new Error(result.error);
    game = result.state;
  }
  return game;
}

describe("buildLocalResultPayload", () => {
  it("produces a payload the server schema accepts", () => {
    const payload = buildLocalResultPayload(finishedGame());
    expect(payload).not.toBeNull();
    expect(localResultSchema.safeParse(payload).success).toBe(true);
  });

  it("returns null for unfinished games", () => {
    const game = { ...finishedGame(), phase: "drafting" as const };
    expect(buildLocalResultPayload(game)).toBeNull();
  });
});

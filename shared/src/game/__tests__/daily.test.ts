import { describe, expect, it } from "vitest";
import type { TurnMove } from "../engine";
import { applyAction, getCurrentPlayerId } from "../engine";
import { decideBotAction } from "../bot";
import {
  createDailyGame,
  DAILY_BOT_ID,
  dailyNumber,
  dailyShareText,
  pickDailyCategory,
  ratingSquare,
  replayDailyGame,
  toDateKey,
} from "../daily";
import { SIM_SEEDS } from "./simulate";

// Plays a whole daily as a simple human (buys anything rated 70+) and records the moves.
function playAsHuman(dateKey: string): TurnMove[] {
  let state = createDailyGame(dateKey, SIM_SEEDS, "Sam");
  const moves: TurnMove[] = [];
  while (state.phase === "drafting") {
    const playerId = getCurrentPlayerId(state) ?? "";
    let move: TurnMove;
    if (playerId === DAILY_BOT_ID) {
      move = decideBotAction(state, playerId);
    } else {
      const rating = state.currentItem?.rating ?? 0;
      const affordable = applyAction(state, { type: "buy", playerId }, 0).ok;
      move = rating >= 70 && affordable ? { type: "buy" } : { type: "pass" };
      moves.push(move);
    }
    const result = applyAction(state, { ...move, playerId }, 0);
    if (!result.ok) throw new Error(result.error);
    state = result.state;
  }
  return moves;
}

describe("daily dates", () => {
  it("uses the UTC date and numbers days from the first daily", () => {
    expect(toDateKey(new Date("2026-11-18T23:30:00Z"))).toBe("2026-11-18");
    expect(dailyNumber("2026-11-17")).toBe(1);
    expect(dailyNumber("2026-11-28")).toBe(12);
    expect(dailyNumber("2027-01-01")).toBe(46);
  });
});

describe("the daily game", () => {
  it("is identical for everyone on the same day", () => {
    const a = createDailyGame("2026-11-20", SIM_SEEDS, "Asha");
    const b = createDailyGame("2026-11-20", [...SIM_SEEDS].reverse(), "Ben");
    expect(a.settings.categorySlug).toBe(b.settings.categorySlug);
    expect(a.currentItem).toEqual(b.currentItem);
    expect(a.itemPool).toEqual(b.itemPool);
  });

  it("changes from day to day", () => {
    const days = ["2026-11-20", "2026-11-21", "2026-11-22", "2026-11-23"];
    const firstItems = new Set(days.map((day) => createDailyGame(day, SIM_SEEDS, "Sam").currentItem?.id));
    expect(firstItems.size).toBeGreaterThan(1);
    const categories = new Set(days.map((day) => pickDailyCategory(day, SIM_SEEDS).slug));
    expect(categories.size).toBeGreaterThan(1);
  });

  it("uses the fixed daily rules against a hard bot", () => {
    const game = createDailyGame("2026-11-20", SIM_SEEDS, "Sam");
    expect(game.settings).toMatchObject({ draftStyle: "classic", startingBudget: 20, slotCount: 5, mysteryItems: true });
    expect(game.settings.botDifficulty).toBe("hard");
    expect(game.players.map((p) => p.isBot)).toEqual([false, true]);
  });
});

describe("replayDailyGame", () => {
  it("rebuilds the same result from the player's moves", () => {
    const moves = playAsHuman("2026-11-20");
    const replay = replayDailyGame("2026-11-20", SIM_SEEDS, "Sam", moves);
    if (!replay.ok) throw new Error(replay.error);
    expect(replay.state.phase).toBe("finished");
    expect(replay.state.players[0]?.team.every((slot) => slot !== null)).toBe(true);
  });

  it("rejects missing, extra and illegal moves", () => {
    const moves = playAsHuman("2026-11-20");
    expect(replayDailyGame("2026-11-20", SIM_SEEDS, "Sam", moves.slice(0, -1)).ok).toBe(false);
    expect(replayDailyGame("2026-11-20", SIM_SEEDS, "Sam", [...moves, { type: "pass" }])).toEqual({
      ok: false,
      error: "There are more moves than the game needed",
    });
    // Buying every item can't work: the budget rule blocks it at some point.
    const greedy: TurnMove[] = [];
    for (let i = 0; i < 40; i++) greedy.push({ type: "buy" });
    expect(replayDailyGame("2026-11-20", SIM_SEEDS, "Sam", greedy).ok).toBe(false);
  });

  it("gives a different (or invalid) result when the moves are for another day", () => {
    const moves = playAsHuman("2026-11-20");
    const sameDay = replayDailyGame("2026-11-20", SIM_SEEDS, "Sam", moves);
    const otherDay = replayDailyGame("2026-11-21", SIM_SEEDS, "Sam", moves);
    if (!sameDay.ok) throw new Error(sameDay.error);
    if (otherDay.ok) {
      expect(otherDay.state.players[0]?.team).not.toEqual(sameDay.state.players[0]?.team);
    }
  });
});

describe("share text", () => {
  const item = (rating: number) => ({ id: "x", name: "X", category: "t", price: 3, rating, tag: "T" });

  it("colours each slot by rating", () => {
    expect(ratingSquare(item(85))).toBe("🟩");
    expect(ratingSquare(item(70))).toBe("🟨");
    expect(ratingSquare(item(50))).toBe("⬜");
    expect(ratingSquare(null)).toBe("⬜");
  });

  it("matches the agreed format", () => {
    const team = [item(90), item(81), item(65), item(88), item(10)];
    expect(dailyShareText("2026-11-28", 412, team)).toBe("Budget Draft #12 — 412 pts 🟩🟩🟨🟩⬜");
  });
});

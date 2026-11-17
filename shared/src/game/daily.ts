import type { Item, PublicItem } from "../types/item";
import type { GameResults, GameSettings, GameState } from "../types/game";
import type { SeedCategory } from "../schemas";
import { decideBotAction } from "./bot";
import { DEFAULT_SETTINGS } from "./constants";
import { applyAction, createGame, getCurrentPlayerId, type TurnMove } from "./engine";
import { computeResults } from "./scoring";
import { createSeededRandom, hashString } from "./seededRandom";

// Daily Challenge: everyone gets the same category and the same item order
// each day, against the same hard bot. The date is the seed.
//
// The browser plays the game; the server REPLAYS it from the list of moves
// with this same code to get the score, so a posted score can't be faked.
// That only works because everything here is deterministic: the seeded
// shuffle, and a bot that never uses randomness.

export const DAILY_FIRST_DATE = "2026-11-17"; // Daily #1
export const DAILY_PLAYER_ID = "daily-player";
export const DAILY_BOT_ID = "daily-bot";
export const DAILY_BOT_NAME = "Daily Bot";

// Fixed so every attempt is comparable: Classic, $20, 5 slots, mystery items
// on for a bit of risk, against one hard bot.
export const DAILY_SETTINGS: GameSettings = {
  ...DEFAULT_SETTINGS,
  mysteryItems: true,
  botDifficulty: "hard",
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// The UTC date as "YYYY-MM-DD". UTC so the whole world shares one daily.
export function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function dateKeyToTime(dateKey: string): number {
  const [year, month, day] = dateKey.split("-").map(Number);
  return Date.UTC(year ?? 1970, (month ?? 1) - 1, day ?? 1);
}

// Daily #1 is DAILY_FIRST_DATE, #2 the day after, and so on.
export function dailyNumber(dateKey: string): number {
  const days = Math.round((dateKeyToTime(dateKey) - dateKeyToTime(DAILY_FIRST_DATE)) / MS_PER_DAY);
  return days + 1;
}

// Builds game items from a seed file. Shared so the browser and the server
// produce exactly the same items (same ids) for the same file.
export function itemsFromSeed(seed: SeedCategory): Item[] {
  const items: Item[] = [];
  for (let i = 0; i < seed.items.length; i++) {
    const seedItem = seed.items[i];
    if (!seedItem) {
      continue;
    }
    const item: Item = {
      id: `${seed.slug}-${i}`,
      name: seedItem.name,
      category: seed.slug,
      price: seedItem.price,
      rating: seedItem.rating,
      tag: seedItem.tag,
    };
    if (seedItem.emoji !== undefined) {
      item.emoji = seedItem.emoji;
    }
    items.push(item);
  }
  return items;
}

// Today's category, picked from the date. Sorted by slug first so the
// order the files were loaded in doesn't matter.
export function pickDailyCategory(dateKey: string, categories: SeedCategory[]): SeedCategory {
  if (categories.length === 0) {
    throw new Error("No categories to pick from");
  }
  const sorted = [...categories];
  sorted.sort((a, b) => (a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0));
  const index = hashString(`category:${dateKey}`) % sorted.length;
  return sorted[index] as SeedCategory;
}

export function createDailyGame(dateKey: string, categories: SeedCategory[], playerName: string): GameState {
  const category = pickDailyCategory(dateKey, categories);
  return createGame({
    mode: "bot",
    settings: { ...DAILY_SETTINGS, categorySlug: category.slug },
    players: [
      { id: DAILY_PLAYER_ID, name: playerName, isBot: false },
      { id: DAILY_BOT_ID, name: DAILY_BOT_NAME, isBot: true },
    ],
    items: itemsFromSeed(category),
    roles: category.roles,
    now: 0,
    random: createSeededRandom(hashString(`items:${dateKey}`)),
  });
}

export type DailyReplay = { ok: true; state: GameState; results: GameResults } | { ok: false; error: string };

// Plays the day's game again: the bot's turns are worked out here, and the
// player's turns come from `moves`, in order. Any illegal, missing or extra
// move means the submission doesn't match a real game.
export function replayDailyGame(
  dateKey: string,
  categories: SeedCategory[],
  playerName: string,
  moves: TurnMove[],
): DailyReplay {
  let state = createDailyGame(dateKey, categories, playerName);
  let nextMove = 0;

  while (state.phase === "drafting") {
    const playerId = getCurrentPlayerId(state);
    if (playerId === null) {
      return { ok: false, error: "The game got stuck" };
    }
    let move: TurnMove;
    if (playerId === DAILY_BOT_ID) {
      move = decideBotAction(state, DAILY_BOT_ID);
    } else {
      const playerMove = moves[nextMove];
      if (playerMove === undefined) {
        return { ok: false, error: "The game isn't finished" };
      }
      move = playerMove;
      nextMove += 1;
    }
    const result = applyAction(state, { ...move, playerId }, 0);
    if (!result.ok) {
      return { ok: false, error: `Move ${nextMove} isn't allowed: ${result.error}` };
    }
    state = result.state;
  }

  if (nextMove !== moves.length) {
    return { ok: false, error: "There are more moves than the game needed" };
  }
  return { ok: true, state, results: computeResults(state) };
}

// One square per slot, so a result can be shared without spoiling the picks.
export function ratingSquare(item: PublicItem | null): string {
  if (item === null || item.isBench === true || item.rating === null || item.rating < 60) {
    return "⬜";
  }
  if (item.rating >= 80) {
    return "🟩";
  }
  return "🟨";
}

// e.g. "Budget Draft #12 — 412 pts 🟩🟩🟨🟩⬜"
export function dailyShareText(dateKey: string, total: number, team: (PublicItem | null)[]): string {
  let squares = "";
  for (const item of team) {
    squares += ratingSquare(item);
  }
  return `Budget Draft #${dailyNumber(dateKey)} — ${total} pts ${squares}`;
}

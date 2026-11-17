import type { Item } from "../../types/item";
import type { GameSettings, PlayerState } from "../../types/game";
import { createGame, type NewPlayer } from "../engine";
import type { GameMode } from "../../types/game";

// With Fisher–Yates, a random() that always returns just under 1 swaps every
// element with itself, so the pool keeps the order we wrote it in.
export const noShuffle = (): number => 0.999999;

export const NOW = 1_000_000;

export function makeItem(id: string, price: number, rating: number): Item {
  return { id, name: `Item ${id}`, category: "test", price, rating, tag: "Test" };
}

export function makePlayer(overrides: Partial<PlayerState> = {}): PlayerState {
  return {
    id: "p1",
    name: "Player 1",
    isBot: false,
    isConnected: true,
    budget: 20,
    team: [null, null, null, null, null],
    ...overrides,
  };
}

export function makeSettings(overrides: Partial<GameSettings> = {}): GameSettings {
  return {
    startingBudget: 20,
    slotCount: 3,
    turnSeconds: 0,
    voteSeconds: 30,
    categorySlug: "test",
    draftStyle: "classic",
    balancedTeam: false,
    mysteryItems: false,
    powerUps: false,
    ...overrides,
  };
}

export function makePlayers(count: number, botIds: string[] = []): NewPlayer[] {
  const players: NewPlayer[] = [];
  for (let i = 1; i <= count; i++) {
    const id = `p${i}`;
    players.push({ id, name: `Player ${i}`, isBot: botIds.includes(id) });
  }
  return players;
}

// Many cheap items, so tests don't accidentally run out of pool.
export function makeItems(count: number, price = 2, rating = 50): Item[] {
  const items: Item[] = [];
  for (let i = 1; i <= count; i++) {
    items.push(makeItem(`i${i}`, price, rating));
  }
  return items;
}

export function startGame(options: {
  playerCount?: number;
  items?: Item[];
  settings?: Partial<GameSettings>;
  mode?: GameMode;
  botIds?: string[];
} = {}) {
  return createGame({
    mode: options.mode ?? "local",
    settings: makeSettings(options.settings),
    players: makePlayers(options.playerCount ?? 2, options.botIds),
    items: options.items ?? makeItems(30),
    now: NOW,
    random: noShuffle,
  });
}

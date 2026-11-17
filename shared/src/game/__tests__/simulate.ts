// Plays whole bot-vs-bot games on the real seed categories, for the
// difficulty tests. Everything is seeded, so results are the same every run.
import animeCharacters from "../../../../server/seed/anime-characters.json";
import bollywoodActors from "../../../../server/seed/bollywood-actors.json";
import cricket from "../../../../server/seed/cricket.json";
import f1Drivers from "../../../../server/seed/f1-drivers.json";
import fastFood from "../../../../server/seed/fast-food.json";
import football from "../../../../server/seed/football.json";
import nba from "../../../../server/seed/nba.json";
import rappers from "../../../../server/seed/rappers.json";
import superheroes from "../../../../server/seed/superheroes.json";
import techCeos from "../../../../server/seed/tech-ceos.json";
import type { Item } from "../../types/item";
import type { BotDifficulty, DraftStyle, GameSettings } from "../../types/game";
import { seedCategorySchema } from "../../schemas";
import { decideBotMoveAt } from "../bot";
import { DEFAULT_SETTINGS } from "../constants";
import { applyAction, createGame, getCurrentPlayerId } from "../engine";
import { computeResults } from "../scoring";
import { createSeededRandom } from "../seededRandom";

interface SimCategory {
  slug: string;
  items: Item[];
  roles: string[];
}

function loadCategories(): SimCategory[] {
  const raw = [animeCharacters, bollywoodActors, cricket, f1Drivers, fastFood, football, nba, rappers, superheroes, techCeos];
  const categories: SimCategory[] = [];
  for (const file of raw) {
    const seed = seedCategorySchema.parse(file);
    const items: Item[] = [];
    for (let i = 0; i < seed.items.length; i++) {
      const item = seed.items[i];
      if (item) {
        items.push({ id: `${seed.slug}-${i}`, name: item.name, category: seed.slug, price: item.price, rating: item.rating, tag: item.tag });
      }
    }
    categories.push({ slug: seed.slug, items, roles: seed.roles });
  }
  return categories;
}

export const SIM_CATEGORIES = loadCategories();

export interface SimOptions {
  seats: BotDifficulty[]; // one difficulty per seat, in seat order
  draftStyle: DraftStyle;
  seed: number;
  extras?: Partial<GameSettings>;
}

// Returns each seat's final score, in seat order.
export function playBotGame(options: SimOptions): number[] {
  const category = SIM_CATEGORIES[options.seed % SIM_CATEGORIES.length] as SimCategory;
  const players = options.seats.map((_, index) => ({ id: `seat${index}`, name: `Seat ${index}`, isBot: true }));
  let state = createGame({
    mode: "bot",
    settings: { ...DEFAULT_SETTINGS, ...options.extras, draftStyle: options.draftStyle, categorySlug: category.slug },
    players,
    items: category.items,
    roles: category.roles,
    now: 0,
    random: createSeededRandom(options.seed),
  });

  let moves = 0;
  while (state.phase === "drafting") {
    moves += 1;
    if (moves > 2000) {
      throw new Error("Game did not finish");
    }
    const playerId = getCurrentPlayerId(state) ?? "";
    const seat = Number(playerId.replace("seat", ""));
    const move = decideBotMoveAt(state, playerId, options.seats[seat] ?? "easy");
    const result = applyAction(state, { ...move, playerId }, 0);
    if (!result.ok) {
      // A bot asking for an illegal move is a bug in the bot.
      throw new Error(`Seat ${seat} made an illegal move ${JSON.stringify(move)}: ${result.error}`);
    }
    state = result.state;
  }

  const scores: number[] = [];
  const results = computeResults(state);
  for (const player of players) {
    const score = results.scores.find((entry) => entry.playerId === player.id);
    scores.push(score ? score.total : 0);
  }
  return scores;
}

// Plays `games` two-seat games and returns how often `first` beat `second`
// (a tie counts as half a win). Seats swap every game, so going first
// doesn't favour either bot.
export function winRate(first: BotDifficulty, second: BotDifficulty, draftStyle: DraftStyle, games: number, extras?: Partial<GameSettings>): number {
  let wins = 0;
  for (let game = 0; game < games; game++) {
    const firstSeat = game % 2;
    const seats: BotDifficulty[] = firstSeat === 0 ? [first, second] : [second, first];
    const scores = playBotGame({ seats, draftStyle, seed: 1000 + game, extras });
    const mine = scores[firstSeat] ?? 0;
    const theirs = scores[1 - firstSeat] ?? 0;
    if (mine > theirs) wins += 1;
    else if (mine === theirs) wins += 0.5;
  }
  return wins / games;
}

// For the fairness check: how often seat 0 beats seat 1 with the same bot in both.
export function seatZeroWinRate(difficulty: BotDifficulty, draftStyle: DraftStyle, games: number): number {
  let wins = 0;
  for (let game = 0; game < games; game++) {
    const scores = playBotGame({ seats: [difficulty, difficulty], draftStyle, seed: 5000 + game });
    const seat0 = scores[0] ?? 0;
    const seat1 = scores[1] ?? 0;
    if (seat0 > seat1) wins += 1;
    else if (seat0 === seat1) wins += 0.5;
  }
  return wins / games;
}

import type { GameState } from "../types/game";
import { minimumBid } from "./auction";
import { canSpend, countEmptySlots } from "./rules";

// Prices roughly follow ratings at about 10 rating points per $1, so a
// ratio above 11 means the item is better value than average.
export const BOT_VALUE_THRESHOLD = 11;

// What a bot decided. The caller adds the bot's id to turn it into a PlayerAction.
export type BotMove = { type: "buy" } | { type: "pass" } | { type: "bid"; amount: number };

// Decides what a bot whose turn it is should do.
// Classic: BUY or PASS at the listed price.
// Auction: bid the minimum when that minimum is good value, otherwise pass.
export function decideBotAction(state: GameState, botId: string): BotMove {
  const item = state.currentItem;
  const bot = state.players.find((p) => p.id === botId);
  if (item === null || !bot) {
    return { type: "pass" };
  }

  // The price the bot would pay right now.
  let price = item.price;
  if (state.auction !== null) {
    price = minimumBid(state.auction);
  }
  if (!canSpend(bot, price)) {
    return { type: "pass" };
  }

  const wantsIt = isGoodDeal(state, item.rating, price);
  if (!wantsIt) {
    return { type: "pass" };
  }
  if (state.auction !== null) {
    return { type: "bid", amount: price };
  }
  return { type: "buy" };
}

function isGoodDeal(state: GameState, rating: number, price: number): boolean {
  // If there aren't enough items left to fill everyone's empty slots,
  // the bot takes whatever it can. Otherwise it would end up with
  // rating-10 bench players while waiting for a bargain that never comes.
  let emptySlotsAcrossAllPlayers = 0;
  for (const player of state.players) {
    emptySlotsAcrossAllPlayers += countEmptySlots(player);
  }
  const itemsLeftIncludingThisOne = state.itemPool.length + 1;
  if (itemsLeftIncludingThisOne <= emptySlotsAcrossAllPlayers) {
    return true;
  }

  // Free items (price 0) never appear in the pool, but guard the division anyway.
  if (price <= 0) {
    return true;
  }
  return rating / price >= BOT_VALUE_THRESHOLD;
}

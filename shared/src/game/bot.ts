import type { GameState } from "../types/game";
import { canBuy, countEmptySlots } from "./rules";

// Prices roughly follow ratings at about 10 rating points per $1, so a
// ratio above 11 means the item is better value than average.
export const BOT_VALUE_THRESHOLD = 11;

// Decides BUY or PASS for a bot whose turn it is.
export function decideBotAction(state: GameState, botId: string): "buy" | "pass" {
  const item = state.currentItem;
  const bot = state.players.find((p) => p.id === botId);
  if (item === null || !bot) {
    return "pass";
  }
  if (!canBuy(bot, item)) {
    return "pass";
  }

  // If there aren't enough items left to fill everyone's empty slots,
  // the bot takes whatever it can. Otherwise it would end up with
  // rating-10 bench players while waiting for a bargain that never comes.
  let emptySlotsAcrossAllPlayers = 0;
  for (const player of state.players) {
    emptySlotsAcrossAllPlayers += countEmptySlots(player);
  }
  const itemsLeftIncludingThisOne = state.itemPool.length + 1;
  if (itemsLeftIncludingThisOne <= emptySlotsAcrossAllPlayers) {
    return "buy";
  }

  // Free items (price 0) never appear in the pool, but guard the division anyway.
  if (item.price <= 0) {
    return "buy";
  }
  const valueRatio = item.rating / item.price;
  if (valueRatio >= BOT_VALUE_THRESHOLD) {
    return "buy";
  }
  return "pass";
}

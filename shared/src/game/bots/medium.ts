import type { TurnMove } from "../engine";
import { canSpend, countEmptySlots, maxSpendable } from "../rules";
import { believedRating, currentPrice, fairPriceForRating, findBot, itemsAreRunningOut, type BotView } from "./view";

// An item this many points above the average of what's left is a "star".
export const MEDIUM_STAR_MARGIN = 15;
// Rating per dollar that makes a below-average item worth taking anyway.
export const MEDIUM_BARGAIN_RATIO = 14;

// Medium: compares the item with the average rating still to come.
// Below average: only a real bargain. Above average: worth its share of the
// budget (budget ÷ empty slots). A star: a fair price plus $2.
export function decideMedium(view: BotView): TurnMove {
  const item = view.game.currentItem;
  const bot = findBot(view);
  if (item === null || !bot) {
    return { type: "pass" };
  }
  const price = currentPrice(view, item);
  if (!canSpend(bot, price)) {
    return { type: "pass" };
  }
  const rating = believedRating(item);

  // The most the bot will pay for this item. Unlike Easy it is choosy:
  // a below-average item is only worth it as a real bargain.
  const average = averageRating(view);
  let maxPrice = Math.floor(rating / MEDIUM_BARGAIN_RATIO);
  if (rating >= average) {
    // Better than what's typically left: worth its share of the budget.
    const budgetPerSlot = Math.ceil(bot.budget / countEmptySlots(bot));
    maxPrice = Math.max(maxPrice, budgetPerSlot);
  }
  if (rating >= average + MEDIUM_STAR_MARGIN) {
    maxPrice = Math.max(maxPrice, fairPriceForRating(rating) + 2);
  }
  if (itemsAreRunningOut(view)) {
    maxPrice = maxSpendable(bot);
  }

  if (price > maxPrice) {
    return { type: "pass" };
  }
  if (view.game.auction !== null) {
    return { type: "bid", amount: price };
  }
  return { type: "buy" };
}

// The average rating of the items not revealed yet (0 if none are left).
function averageRating(view: BotView): number {
  if (view.unseen.length === 0) {
    return 0;
  }
  let total = 0;
  for (const item of view.unseen) {
    total += item.rating;
  }
  return total / view.unseen.length;
}

import type { TurnMove } from "../engine";
import { canSpend } from "../rules";
import { believedRating, currentPrice, findBot, itemsAreRunningOut, type BotView } from "./view";

// Prices roughly follow ratings at about 10 rating points per $1, so a
// ratio above 11 means the item is better value than average.
export const BOT_VALUE_THRESHOLD = 11;

// Easy: takes an item when its rating per dollar is good. Never pays for
// stars (they're never "good value"), and opens auctions at the minimum.
export function decideEasy(view: BotView): TurnMove {
  const item = view.game.currentItem;
  const bot = findBot(view);
  if (item === null || !bot) {
    return { type: "pass" };
  }
  const price = currentPrice(view, item);
  if (!canSpend(bot, price)) {
    return { type: "pass" };
  }

  let wantsIt = itemsAreRunningOut(view);
  if (!wantsIt) {
    wantsIt = believedRating(item) / price >= BOT_VALUE_THRESHOLD;
  }
  if (!wantsIt) {
    return { type: "pass" };
  }
  if (view.game.auction !== null) {
    return { type: "bid", amount: price };
  }
  return { type: "buy" };
}

import type { PublicItem } from "../../types/item";
import { BALANCED_TEAM_BONUS } from "../constants";
import type { TurnMove } from "../engine";
import { findMissingRoles } from "../roles";
import { canSpend, countEmptySlots, maxSpendable } from "../rules";
import { buildPlanTable, itemsTheBotMightGet, planValue } from "./planning";
import { believedRating, countActiveDrafters, currentPrice, findBot, type BotView } from "./view";

// Hard: plans its budget across all its empty slots.
//
// For the current item it asks: "Is (this item now + the best plan for my
// other slots with the money left) better than (the best plan for all my
// slots, skipping this item)?" The plans use the items still to come,
// thinned out because other players will take some of them.
//
// In an auction the same comparison gives the most it should ever pay:
// it bids the minimum while the minimum is still worth it.
// With Balanced team on it values items that cover a role it still needs.
export function decideHard(view: BotView): TurnMove {
  const item = view.game.currentItem;
  const bot = findBot(view);
  if (item === null || !bot) {
    return { type: "pass" };
  }
  const price = currentPrice(view, item);
  if (!canSpend(bot, price)) {
    return { type: "pass" };
  }

  const highestWorthwhilePrice = findHighestWorthwhilePrice(view, item);
  if (price > highestWorthwhilePrice) {
    return { type: "pass" };
  }
  if (view.game.auction !== null) {
    return { type: "bid", amount: price };
  }
  return { type: "buy" };
}

// The most the bot should pay for this item (0 if it isn't worth taking at all).
export function findHighestWorthwhilePrice(view: BotView, item: PublicItem): number {
  const bot = findBot(view);
  if (!bot) {
    return 0;
  }
  const emptySlots = countEmptySlots(bot);
  const candidates = itemsTheBotMightGet(view.unseen, countActiveDrafters(view));
  const table = buildPlanTable(candidates, emptySlots, bot.budget);

  const skipValue = planValue(table, emptySlots, bot.budget);
  const itemValue = believedRating(item) + roleAdjustment(view, item.tag);

  let highest = 0;
  const limit = maxSpendable(bot);
  for (let price = 1; price <= limit; price++) {
    const takeValue = itemValue - price + planValue(table, emptySlots - 1, bot.budget - price);
    if (takeValue >= skipValue) {
      highest = price;
    } else {
      break; // paying more only makes it worse
    }
  }
  return highest;
}

// Balanced team: an item that covers a missing role is worth a share of the
// bonus. An item that doesn't, when every remaining slot is needed for the
// missing roles, would make the bonus impossible, so it costs the bonus.
function roleAdjustment(view: BotView, tag: string): number {
  const requiredRoles = view.game.requiredRoles;
  const bot = findBot(view);
  if (requiredRoles.length === 0 || !bot) {
    return 0;
  }
  const missing = findMissingRoles(bot.team, requiredRoles);
  const emptySlots = countEmptySlots(bot);
  if (missing.length === 0 || missing.length > emptySlots) {
    return 0; // already earned, or already impossible
  }
  if (missing.includes(tag)) {
    return BALANCED_TEAM_BONUS / missing.length;
  }
  if (missing.length === emptySlots) {
    return -BALANCED_TEAM_BONUS;
  }
  return 0;
}

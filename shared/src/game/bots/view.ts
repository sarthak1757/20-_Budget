import type { PublicItem } from "../../types/item";
import type { GameState, PublicGameState, PublicPlayerState } from "../../types/game";
import { minimumBid } from "../auction";
import { MAX_PRICE, MIN_PRICE } from "../constants";
import { toPublicState } from "../publicState";
import { countEmptySlots } from "../rules";

// What a bot is allowed to know. Bots must play fair, so they never see the
// full GameState: they get the same public state a human gets, plus the
// items not revealed yet as a SORTED list. A careful human could work that
// list out from the category page; what stays secret is the ORDER of the pile.
export interface UnseenItem {
  rating: number;
  price: number;
  tag: string;
}

export interface BotView {
  game: PublicGameState;
  botId: string;
  unseen: UnseenItem[]; // sorted by rating then price, so it says nothing about what comes next
}

export function makeBotView(state: GameState, botId: string): BotView {
  const unseen: UnseenItem[] = [];
  for (const item of state.itemPool) {
    unseen.push({ rating: item.rating, price: item.price, tag: item.tag });
  }
  unseen.sort((a, b) => a.rating - b.rating || a.price - b.price);
  return { game: toPublicState(state), botId, unseen };
}

export function findBot(view: BotView): PublicPlayerState | undefined {
  for (const player of view.game.players) {
    if (player.id === view.botId) {
      return player;
    }
  }
  return undefined;
}

// What the bot would pay to take the current item right now:
// the listed price in Classic, the minimum bid in an auction.
export function currentPrice(view: BotView, item: PublicItem): number {
  if (view.game.auction !== null) {
    return minimumBid(view.game.auction);
  }
  return item.price;
}

// What a fairly priced item at this price is usually rated (seed prices
// follow ratings at roughly $1 per 5 points above 45). Used for mystery items.
export function guessRatingFromPrice(price: number): number {
  return 45 + 5 * price;
}

// The reverse: a fair price for a rating, between $1 and $10.
export function fairPriceForRating(rating: number): number {
  const price = Math.round((rating - 45) / 5);
  return Math.min(MAX_PRICE, Math.max(MIN_PRICE, price));
}

// The rating the bot believes the item has: a guess for mystery items.
export function believedRating(item: PublicItem): number {
  if (item.rating === null) {
    return guessRatingFromPrice(item.price);
  }
  return item.rating;
}

// True when there aren't enough items left to fill everyone's empty slots.
// Waiting for a bargain then just ends in rating-10 bench players.
export function itemsAreRunningOut(view: BotView): boolean {
  let emptySlotsAcrossAllPlayers = 0;
  for (const player of view.game.players) {
    emptySlotsAcrossAllPlayers += countEmptySlots(player);
  }
  const itemsLeftIncludingThisOne = view.unseen.length + 1;
  return itemsLeftIncludingThisOne <= emptySlotsAcrossAllPlayers;
}

// How many players are still trying to fill slots (including the bot).
export function countActiveDrafters(view: BotView): number {
  let active = 0;
  for (const player of view.game.players) {
    if (countEmptySlots(player) > 0) {
      active += 1;
    }
  }
  return Math.max(1, active);
}

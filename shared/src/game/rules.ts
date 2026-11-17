import type { PublicItem } from "../types/item";
import type { PlayerState } from "../types/game";

// These work on both full and public players: they only look at budgets,
// prices and which slots are empty, never at (possibly hidden) ratings.
type AnyPlayer = PlayerState<PublicItem>;

export function countEmptySlots(player: AnyPlayer): number {
  let empty = 0;
  for (const slot of player.team) {
    if (slot === null) {
      empty += 1;
    }
  }
  return empty;
}

export function isTeamFull(player: AnyPlayer): boolean {
  return countEmptySlots(player) === 0;
}

export function findFirstEmptySlot(player: AnyPlayer): number {
  for (let i = 0; i < player.team.length; i++) {
    if (player.team[i] === null) {
      return i;
    }
  }
  return -1;
}

// The most a player may spend on ONE item right now.
// They must keep $1 for every OTHER empty slot, so they can always finish
// their team with $1 items. Example: $20 and 5 empty slots -> 20 - 4 = $16.
export function maxSpendable(player: AnyPlayer): number {
  const emptySlots = countEmptySlots(player);
  if (emptySlots === 0) {
    return 0;
  }
  const moneyToKeep = emptySlots - 1;
  return player.budget - moneyToKeep;
}

// Returns a human-readable reason why the player can't spend this amount on
// one item, or null if they can. Used for buying (the price) and for bids.
// The server uses this to reject bad requests; the UI uses it to explain a disabled button.
export function getSpendBlockReason(player: AnyPlayer, amount: number): string | null {
  const emptySlots = countEmptySlots(player);
  if (emptySlots === 0) {
    return "Your team is already full";
  }
  if (amount > player.budget) {
    return `You only have $${player.budget}`;
  }
  if (amount > maxSpendable(player)) {
    const otherSlots = emptySlots - 1;
    return `You must keep $1 for each of your ${otherSlots} other empty slots`;
  }
  return null;
}

export function canSpend(player: AnyPlayer, amount: number): boolean {
  return getSpendBlockReason(player, amount) === null;
}

export function getBuyBlockReason(player: AnyPlayer, item: { price: number }): string | null {
  return getSpendBlockReason(player, item.price);
}

export function canBuy(player: AnyPlayer, item: { price: number }): boolean {
  return getBuyBlockReason(player, item) === null;
}

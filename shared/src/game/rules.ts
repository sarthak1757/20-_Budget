import type { Item } from "../types/item";
import type { PlayerState } from "../types/game";

export function countEmptySlots(player: PlayerState): number {
  let empty = 0;
  for (const slot of player.team) {
    if (slot === null) {
      empty += 1;
    }
  }
  return empty;
}

export function isTeamFull(player: PlayerState): boolean {
  return countEmptySlots(player) === 0;
}

export function findFirstEmptySlot(player: PlayerState): number {
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
export function maxSpendable(player: PlayerState): number {
  const emptySlots = countEmptySlots(player);
  if (emptySlots === 0) {
    return 0;
  }
  const moneyToKeep = emptySlots - 1;
  return player.budget - moneyToKeep;
}

// Returns a human-readable reason why the player can't buy, or null if they can.
// The server uses this to reject bad requests; the UI uses it to explain a disabled button.
export function getBuyBlockReason(player: PlayerState, item: Item): string | null {
  const emptySlots = countEmptySlots(player);
  if (emptySlots === 0) {
    return "Your team is already full";
  }
  if (item.price > player.budget) {
    return `You only have $${player.budget}`;
  }
  if (item.price > maxSpendable(player)) {
    const otherSlots = emptySlots - 1;
    return `You must keep $1 for each of your ${otherSlots} other empty slots`;
  }
  return null;
}

export function canBuy(player: PlayerState, item: Item): boolean {
  return getBuyBlockReason(player, item) === null;
}

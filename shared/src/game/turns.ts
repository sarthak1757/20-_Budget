import type { PlayerState } from "../types/game";
import { canSpend, isTeamFull } from "./rules";

export interface TurnQueueResult {
  queue: string[]; // players who will be asked BUY or PASS, in order
  cantAfford: string[]; // players skipped because the budget rule blocks them
}

// Builds the order of players for one item, starting at firstPlayerIndex
// and wrapping around. Players with a full team are left out entirely.
// Players who can't afford the item are skipped up front: budgets only change
// when someone buys, and a buy ends the round, so their answer would always be "pass".
//
// `lowestPriceFor` is the least this player could pay for the item: the price
// in Classic (less with an unused Discount), the $1 opening bid in an auction.
export function buildTurnQueue(
  players: PlayerState[],
  firstPlayerIndex: number,
  lowestPriceFor: (player: PlayerState) => number,
): TurnQueueResult {
  const queue: string[] = [];
  const cantAfford: string[] = [];

  for (let offset = 0; offset < players.length; offset++) {
    const index = (firstPlayerIndex + offset) % players.length;
    const player = players[index];
    if (!player) {
      continue;
    }
    if (isTeamFull(player)) {
      continue;
    }
    if (canSpend(player, lowestPriceFor(player))) {
      queue.push(player.id);
    } else {
      cantAfford.push(player.id);
    }
  }

  return { queue, cantAfford };
}

// The player who goes first moves one seat to the right every round,
// so nobody gets first pick on every item.
export function nextFirstPlayerIndex(current: number, playerCount: number): number {
  return (current + 1) % playerCount;
}

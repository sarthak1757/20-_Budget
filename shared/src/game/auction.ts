import type { Item, PublicItem } from "../types/item";
import type { AuctionState, GameState, PlayerState } from "../types/game";
import type { EngineResult, PlayerAction } from "./engine";
import { canSpend, findFirstEmptySlot, getSpendBlockReason } from "./rules";
import { endRound, makeTurnDeadline } from "./rounds";

// Auction draft style.
//
// The turn queue holds the players still in the bidding, in turn order.
// - A BID moves the bidder to the back of the queue: everyone else gets a
//   chance to answer before it's their turn again.
// - A PASS removes the player from the queue for this item.
// - When the only player left in the queue is the high bidder, they win.
// - If everyone passes before anyone bids, the item is discarded.

// The smallest bid allowed right now: $1 to open, then $1 more than the high bid.
export function minimumBid(auction: AuctionState): number {
  return auction.highBid + 1;
}

// Why this player can't bid this amount, or null if they can. Used by the
// engine to reject bad bids and by the UI to grey out the quick-bid buttons.
export function getBidBlockReason(player: PlayerState<PublicItem>, auction: AuctionState, amount: number): string | null {
  if (!Number.isInteger(amount)) {
    return "Bids are whole dollars";
  }
  const minimum = minimumBid(auction);
  if (amount < minimum) {
    return `The bid must be at least $${minimum}`;
  }
  return getSpendBlockReason(player, amount);
}

// Called by applyAction on its private copy of the state, so mutating is fine here.
export function applyAuctionAction(
  next: GameState,
  player: PlayerState,
  item: Item,
  action: PlayerAction,
  now: number,
): EngineResult {
  const auction = next.auction;
  if (auction === null) {
    return { ok: false, error: "There is no auction running" };
  }

  if (action.type === "buy") {
    return { ok: false, error: "This is an auction: place a bid instead" };
  }
  if (action.type === "veto" || action.type === "discount") {
    return { ok: false, error: "Power-ups are handled before the auction" };
  }

  if (action.type === "bid") {
    const blockReason = getBidBlockReason(player, auction, action.amount);
    if (blockReason !== null) {
      return { ok: false, error: blockReason };
    }
    auction.highBid = action.amount;
    auction.highBidderId = player.id;
    next.turnQueue.shift();
    next.turnQueue.push(player.id);
    next.lastEvents.push({ type: "bid", playerId: player.id, item, amount: action.amount });
  } else {
    next.turnQueue.shift();
    next.lastEvents.push({ type: "passed", playerId: player.id, item, auto: action.auto === true });
  }

  settleAuction(next, item, auction, now);
  return { ok: true, state: next };
}

// Moves the auction along after a bid or pass: skips players who can't
// afford the next bid, then either declares a winner, discards the item,
// or starts the next player's timer.
function settleAuction(next: GameState, item: Item, auction: AuctionState, now: number): void {
  while (true) {
    if (next.turnQueue.length === 0) {
      // Everyone passed and nobody ever bid.
      next.lastEvents.push({ type: "discarded", item });
      endRound(next, now);
      return;
    }

    const frontId = next.turnQueue[0] as string;
    if (next.turnQueue.length === 1 && frontId === auction.highBidderId) {
      awardItem(next, item, frontId, auction.highBid);
      endRound(next, now);
      return;
    }

    // The high bidder is never at the front while others are still in, so
    // `front` here is always someone who has to beat the current bid.
    const front = findPlayer(next, frontId);
    if (front && !canSpend(front, minimumBid(auction))) {
      next.turnQueue.shift();
      next.cantAffordIds.push(frontId);
      continue;
    }

    next.turnDeadline = makeTurnDeadline(next, now);
    return;
  }
}

function awardItem(next: GameState, item: Item, winnerId: string, price: number): void {
  const winner = findPlayer(next, winnerId);
  if (!winner) {
    return;
  }
  // The bid was checked against the budget rule when it was placed, and
  // budgets don't change during a round, so the winner can always pay.
  winner.team[findFirstEmptySlot(winner)] = { ...item, paidPrice: price };
  winner.budget -= price;
  next.lastEvents.push({ type: "bought", playerId: winner.id, item, price });
}

function findPlayer(state: GameState, playerId: string): PlayerState | undefined {
  for (const player of state.players) {
    if (player.id === playerId) {
      return player;
    }
  }
  return undefined;
}

import type { GameEvent, GameState, PlayerState } from "../types/game";
import { fillEmptySlotsWithBench } from "./bench";
import { discountedPrice, hasPowerUp } from "./powerUps";
import { isTeamFull } from "./rules";
import { shouldHoldVote } from "./scoring";
import { buildTurnQueue, nextFirstPlayerIndex } from "./turns";

// Round helpers shared by Classic and Auction. These MUTATE the state they're
// given, and are only ever called on the private copy that the public engine
// functions make with structuredClone.

export function makeTurnDeadline(state: GameState, now: number): number | null {
  if (state.settings.turnSeconds <= 0) {
    return null;
  }
  return now + state.settings.turnSeconds * 1000;
}

export function endRound(state: GameState, now: number): void {
  state.firstPlayerIndex = nextFirstPlayerIndex(state.firstPlayerIndex, state.players.length);
  startRound(state, now);
}

// Reveals the next item. Loops because an item that NOBODY can afford is
// discarded straight away and the next one revealed.
export function startRound(state: GameState, now: number): void {
  while (true) {
    if (allTeamsFull(state.players)) {
      finishDraft(state, now);
      return;
    }

    const item = state.itemPool.shift();
    if (item === undefined) {
      // Pool ran out before everyone filled their team.
      for (let i = 0; i < state.players.length; i++) {
        const player = state.players[i] as PlayerState;
        state.players[i] = fillEmptySlotsWithBench(player, state.settings.categorySlug);
      }
      finishDraft(state, now);
      return;
    }

    state.roundNumber += 1;
    const isAuction = state.settings.draftStyle === "auction";
    const powerUpsOn = state.settings.powerUps;
    const { queue, cantAfford } = buildTurnQueue(state.players, state.firstPlayerIndex, (player) => {
      // In an auction the least anyone can pay is the $1 opening bid.
      if (isAuction) {
        return 1;
      }
      // A player with an unused Discount could still afford a slightly pricier item.
      if (powerUpsOn && hasPowerUp(player, "discount")) {
        return discountedPrice(item.price);
      }
      return item.price;
    });

    if (queue.length === 0) {
      const discarded: GameEvent = { type: "discarded", item };
      state.lastEvents.push(discarded);
      state.firstPlayerIndex = nextFirstPlayerIndex(state.firstPlayerIndex, state.players.length);
      continue;
    }

    state.currentItem = item;
    state.turnQueue = queue;
    state.cantAffordIds = cantAfford;
    state.auction = isAuction ? { highBid: 0, highBidderId: null } : null;
    state.turnDeadline = makeTurnDeadline(state, now);
    return;
  }
}

export function finishDraft(state: GameState, now: number): void {
  state.currentItem = null;
  state.turnQueue = [];
  state.cantAffordIds = [];
  state.auction = null;
  state.turnDeadline = null;

  if (shouldHoldVote(state.players)) {
    state.phase = "voting";
    // No deadline when voteSeconds is 0 (pass-and-play): the vote ends once everyone has voted.
    state.voteDeadline = state.settings.voteSeconds > 0 ? now + state.settings.voteSeconds * 1000 : null;
  } else {
    finishGame(state);
  }
}

export function finishGame(state: GameState): void {
  state.phase = "finished";
  state.voteDeadline = null;
}

function allTeamsFull(players: PlayerState[]): boolean {
  for (const player of players) {
    if (!isTeamFull(player)) {
      return false;
    }
  }
  return true;
}

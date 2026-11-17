import type { GameSettings } from "../types/game";

export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 4;
export const MIN_SLOTS = 3;
export const MAX_SLOTS = 7;
export const MIN_PRICE = 1;
export const MAX_PRICE = 10;

export const ONLINE_TURN_SECONDS = 15;
export const ONLINE_VOTE_SECONDS = 30;
// Auction turns are shorter: a bid is a quick tap, and there are more turns per item.
export const ONLINE_AUCTION_TURN_SECONDS = 7;

// Voting with 2 players is pointless (each would just vote for the other),
// so we only hold a vote with at least this many humans.
export const MIN_HUMANS_FOR_VOTE = 3;

export const BENCH_RATING = 10;
export const LEFTOVER_POINTS_PER_DOLLAR = 1;

export const DEFAULT_SETTINGS: GameSettings = {
  startingBudget: 20,
  slotCount: 5,
  turnSeconds: 0,
  voteSeconds: 0,
  categorySlug: "football",
  draftStyle: "classic",
  balancedTeam: false,
  mysteryItems: false,
  powerUps: false,
};

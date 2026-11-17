import type { CategorySlug, Item } from "./item";

export type GameMode = "local" | "online" | "bot";

// Lobby is handled by the room (online) or the setup screen (local),
// so a GameState only exists once the draft has started.
export type Phase = "drafting" | "voting" | "finished";

export interface GameSettings {
  startingBudget: number; // default 20
  slotCount: number; // 3–7, default 5
  turnSeconds: number; // 0 means "no timer" (used for pass-and-play)
  voteSeconds: number; // 0 means "no timer": on one shared device people vote one after another
  categorySlug: CategorySlug;
}

export interface PlayerState {
  id: string;
  name: string;
  isBot: boolean;
  isConnected: boolean;
  budget: number;
  team: (Item | null)[]; // always slotCount long; null = empty slot
}

// What happened during the last action. A single action can cause several
// events (e.g. a pass that ends the round discards the item), so the
// UI gets a list and can animate each one.
export type GameEvent =
  | { type: "bought"; playerId: string; item: Item }
  | { type: "passed"; playerId: string; item: Item; auto: boolean }
  | { type: "discarded"; item: Item };

export interface GameState {
  mode: GameMode;
  phase: Phase;
  settings: GameSettings;
  players: PlayerState[];
  itemPool: Item[]; // items not revealed yet. SECRET: never send to clients.
  currentItem: Item | null;
  roundNumber: number; // goes up by 1 every time an item is revealed
  firstPlayerIndex: number; // who acts first this round; rotates each round
  turnQueue: string[]; // player ids still to decide on the current item, in order
  cantAffordIds: string[]; // players skipped this round because of the budget rule
  turnDeadline: number | null; // epoch ms; null when there is no timer
  votes: Record<string, string>; // voterId -> votedForId
  voteDeadline: number | null; // epoch ms
  lastEvents: GameEvent[];
}

// The version of GameState that is safe to send to players.
// `itemPool?: never` is the important part: without it, TypeScript would
// happily accept a full GameState here (extra properties are allowed when
// assigning objects), and the hidden pool could leak to clients.
export type PublicGameState = Omit<GameState, "itemPool"> & {
  itemPool?: never;
  itemsRemaining: number;
};

export interface FinalScore {
  playerId: string;
  name: string;
  ratingTotal: number;
  leftoverBonus: number;
  total: number;
  votesReceived: number;
}

export interface GameResults {
  scores: FinalScore[]; // sorted, best total first
  statsWinnerIds: string[]; // more than one id means a tie
  voteWinnerIds: string[]; // empty if no vote was held or nobody voted
  votingHeld: boolean;
}

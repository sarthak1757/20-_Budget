import type { Item } from "../types/item";
import type { GameMode, GameSettings, GameState, PlayerState } from "../types/game";
import { applyAuctionAction } from "./auction";
import { MAX_PLAYERS, MIN_PLAYERS } from "./constants";
import { pickRequiredRoles } from "./roles";
import { findFirstEmptySlot, getBuyBlockReason } from "./rules";
import { endRound, finishGame, makeTurnDeadline, startRound } from "./rounds";
import { shuffle } from "./shuffle";

// Every function here is pure: it takes a state and returns a NEW state.
// It never touches the network, the database, timers or the input object.
// That's what lets the same code run in the browser (pass-and-play, bot)
// and on the server (online rooms), and makes it easy to test.
//
// `now` (epoch ms) is passed in rather than read from Date.now() so tests
// can control time.

export interface NewPlayer {
  id: string;
  name: string;
  isBot: boolean;
}

export interface CreateGameInput {
  mode: GameMode;
  settings: GameSettings;
  players: NewPlayer[];
  items: Item[];
  roles?: string[]; // the category's roles, for Balanced team
  now: number;
  random?: () => number;
}

// What a player can do on their turn. "buy" is Classic only, "bid" is Auction only.
// The UI and bots produce a TurnMove; the engine also needs to know who made it.
export type TurnMove = { type: "buy" } | { type: "pass" } | { type: "bid"; amount: number };

export type PlayerAction =
  | { type: "buy"; playerId: string }
  | { type: "bid"; playerId: string; amount: number }
  // auto = true when the server passes for a player whose timer ran out
  | { type: "pass"; playerId: string; auto?: boolean };

export type EngineResult = { ok: true; state: GameState } | { ok: false; error: string };

export function createGame(input: CreateGameInput): GameState {
  const { mode, settings, players, items, now } = input;

  // These are programmer errors (the caller should validate first), so we throw.
  if (players.length < MIN_PLAYERS || players.length > MAX_PLAYERS) {
    throw new Error(`A game needs ${MIN_PLAYERS}–${MAX_PLAYERS} players`);
  }
  if (settings.startingBudget < settings.slotCount) {
    throw new Error("Starting budget must be at least $1 per slot");
  }
  const seenIds = new Set<string>();
  for (const player of players) {
    if (seenIds.has(player.id)) {
      throw new Error(`Duplicate player id: ${player.id}`);
    }
    seenIds.add(player.id);
  }

  const playerStates: PlayerState[] = [];
  for (const player of players) {
    const emptyTeam: null[] = [];
    for (let i = 0; i < settings.slotCount; i++) {
      emptyTeam.push(null);
    }
    playerStates.push({
      id: player.id,
      name: player.name,
      isBot: player.isBot,
      isConnected: true,
      budget: settings.startingBudget,
      team: emptyTeam,
    });
  }

  // If Balanced team can't apply (no roles, or too few slots), switch it off,
  // so the stored settings say what was really played.
  const requiredRoles = pickRequiredRoles(settings.balancedTeam, input.roles ?? [], settings.slotCount);

  const state: GameState = {
    mode,
    phase: "drafting",
    settings: { ...settings, balancedTeam: requiredRoles.length > 0 },
    players: playerStates,
    itemPool: shuffle(items, input.random),
    currentItem: null,
    roundNumber: 0,
    firstPlayerIndex: 0,
    turnQueue: [],
    cantAffordIds: [],
    auction: null,
    requiredRoles,
    turnDeadline: null,
    votes: {},
    voteDeadline: null,
    lastEvents: [],
  };

  startRound(state, now);
  return state;
}

// Works on both GameState and PublicGameState, so the UI can use it too.
export function getCurrentPlayerId(state: Pick<GameState, "phase" | "turnQueue">): string | null {
  if (state.phase !== "drafting") {
    return null;
  }
  return state.turnQueue[0] ?? null;
}

// Handles one action from the player whose turn it is.
export function applyAction(state: GameState, action: PlayerAction, now: number): EngineResult {
  if (state.phase !== "drafting") {
    return { ok: false, error: "The draft is over" };
  }
  const item = state.currentItem;
  if (item === null) {
    return { ok: false, error: "There is no item to act on" };
  }
  if (getCurrentPlayerId(state) !== action.playerId) {
    return { ok: false, error: "It's not your turn" };
  }

  // Work on a deep copy so the caller's state is never changed.
  const next = structuredClone(state);
  next.lastEvents = [];
  const player = next.players.find((p) => p.id === action.playerId);
  if (!player) {
    return { ok: false, error: "Unknown player" };
  }

  if (next.settings.draftStyle === "auction") {
    return applyAuctionAction(next, player, item, action, now);
  }

  if (action.type === "bid") {
    return { ok: false, error: "Bidding is only for auction games" };
  }

  if (action.type === "buy") {
    // Checked again here even though the turn queue only holds players who
    // could afford the item: the server must never trust that assumption blindly.
    const blockReason = getBuyBlockReason(player, item);
    if (blockReason !== null) {
      return { ok: false, error: blockReason };
    }
    const slotIndex = findFirstEmptySlot(player);
    player.team[slotIndex] = item;
    player.budget -= item.price;
    next.lastEvents.push({ type: "bought", playerId: player.id, item, price: item.price });
    endRound(next, now);
    return { ok: true, state: next };
  }

  // PASS: this player is done with the item, move to the next one in line.
  next.turnQueue.shift();
  next.lastEvents.push({ type: "passed", playerId: player.id, item, auto: action.auto === true });

  if (next.turnQueue.length === 0) {
    next.lastEvents.push({ type: "discarded", item });
    endRound(next, now);
  } else {
    // Each player gets a full timer for their own decision.
    next.turnDeadline = makeTurnDeadline(next, now);
  }
  return { ok: true, state: next };
}

export function castVote(state: GameState, voterId: string, targetId: string, now: number): EngineResult {
  if (state.phase !== "voting") {
    return { ok: false, error: "Voting is not open" };
  }
  if (state.voteDeadline !== null && now > state.voteDeadline) {
    return { ok: false, error: "Voting has closed" };
  }
  const voter = state.players.find((p) => p.id === voterId);
  if (!voter || voter.isBot) {
    return { ok: false, error: "Only players in this game can vote" };
  }
  const target = state.players.find((p) => p.id === targetId);
  if (!target) {
    return { ok: false, error: "That player isn't in this game" };
  }
  if (voterId === targetId) {
    return { ok: false, error: "You can't vote for yourself" };
  }

  const next = structuredClone(state);
  // Changing your mind before the deadline is allowed: the latest vote counts.
  next.votes[voterId] = targetId;

  if (everyHumanHasVoted(next)) {
    finishGame(next);
  }
  return { ok: true, state: next };
}

// Called when the 30-second vote timer runs out.
export function endVoting(state: GameState): GameState {
  if (state.phase !== "voting") {
    return state;
  }
  const next = structuredClone(state);
  finishGame(next);
  return next;
}

// Marks a player as connected/disconnected. The game doesn't wait for anyone:
// a disconnected player's turn timer still runs and they get auto-passed.
export function setPlayerConnected(state: GameState, playerId: string, isConnected: boolean): GameState {
  const next = structuredClone(state);
  const player = next.players.find((p) => p.id === playerId);
  if (player) {
    player.isConnected = isConnected;
  }
  return next;
}

function everyHumanHasVoted(state: GameState): boolean {
  for (const player of state.players) {
    if (!player.isBot && state.votes[player.id] === undefined) {
      return false;
    }
  }
  return true;
}

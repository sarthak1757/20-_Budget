import {
  DEFAULT_SETTINGS,
  MAX_PLAYERS,
  ONLINE_TURN_SECONDS,
  ONLINE_VOTE_SECONDS,
  setPlayerConnected,
  toPublicState,
  type GameResults,
  type GameSettings,
  type GameState,
  type LobbyPlayer,
  type RoomInfo,
  type RoomSnapshot,
} from "@budget-draft/shared";

// One online room. Lives only in server memory (see README: lost on restart).
// The functions below change the room they're given; the socket handlers
// call them and then broadcast the new snapshot.

export interface RoomPlayer {
  id: string;
  name: string;
  isConnected: boolean;
}

export interface Room {
  code: string;
  hostId: string | null;
  players: RoomPlayer[]; // in join order
  settings: GameSettings;
  game: GameState | null; // null while in the lobby
  results: GameResults | null;
  resultSaved: boolean;
  createdAt: number;
  emptySince: number | null; // when the last connected player left; used for cleanup
}

export interface RoomTiming {
  turnSeconds: number;
  voteSeconds: number;
}

export const ONLINE_TIMING: RoomTiming = {
  turnSeconds: ONLINE_TURN_SECONDS,
  voteSeconds: ONLINE_VOTE_SECONDS,
};

export function createRoom(code: string, categorySlug: string, now: number, timing: RoomTiming = ONLINE_TIMING): Room {
  return {
    code,
    hostId: null, // the first player to join becomes host
    players: [],
    settings: {
      ...DEFAULT_SETTINGS,
      categorySlug,
      turnSeconds: timing.turnSeconds,
      voteSeconds: timing.voteSeconds,
    },
    game: null,
    results: null,
    resultSaved: false,
    createdAt: now,
    emptySince: now, // nobody is connected yet
  };
}

export function findRoomPlayer(room: Room, playerId: string): RoomPlayer | undefined {
  for (const player of room.players) {
    if (player.id === playerId) {
      return player;
    }
  }
  return undefined;
}

export function countConnected(room: Room): number {
  let connected = 0;
  for (const player of room.players) {
    if (player.isConnected) {
      connected += 1;
    }
  }
  return connected;
}

export function roomPhase(room: Room): RoomInfo["phase"] {
  if (room.game === null) {
    return "lobby";
  }
  return room.game.phase;
}

// Adds a brand-new player in the lobby. Returns an error message, or null on success.
export function addPlayer(room: Room, player: { id: string; name: string }, now: number): string | null {
  if (room.game !== null) {
    return "This game has already started";
  }
  if (room.players.length >= MAX_PLAYERS) {
    return "This room is full";
  }
  for (const existing of room.players) {
    if (existing.name.toLowerCase() === player.name.toLowerCase()) {
      return `Someone called "${existing.name}" is already here. Pick another name.`;
    }
  }
  room.players.push({ id: player.id, name: player.name, isConnected: true });
  markConnectedChange(room, now);
  if (room.hostId === null) {
    room.hostId = player.id;
  }
  return null;
}

export function markPlayerConnected(room: Room, playerId: string, isConnected: boolean, now: number): void {
  const player = findRoomPlayer(room, playerId);
  if (!player) {
    return;
  }
  player.isConnected = isConnected;
  if (room.game !== null) {
    room.game = setPlayerConnected(room.game, playerId, isConnected);
  }
  markConnectedChange(room, now);
  passHostIfNeeded(room);
}

// Lobby only: the player leaves for good. (Mid-game we just mark them offline,
// because their team is part of the game.)
export function removePlayer(room: Room, playerId: string, now: number): void {
  const remaining: RoomPlayer[] = [];
  for (const player of room.players) {
    if (player.id !== playerId) {
      remaining.push(player);
    }
  }
  room.players = remaining;
  markConnectedChange(room, now);
  passHostIfNeeded(room);
}

// In the lobby the host must be someone who is actually here, otherwise
// nobody could press Start. Mid-game the server runs everything, so the host
// doesn't matter and we leave it alone.
export function passHostIfNeeded(room: Room): void {
  if (room.game !== null) {
    return;
  }
  const host = room.hostId === null ? undefined : findRoomPlayer(room, room.hostId);
  if (host && host.isConnected) {
    return;
  }

  // Look for the next connected player after the old host, wrapping around.
  let startIndex = 0;
  if (host) {
    startIndex = room.players.indexOf(host) + 1;
  }
  for (let offset = 0; offset < room.players.length; offset++) {
    const candidate = room.players[(startIndex + offset) % room.players.length];
    if (candidate && candidate.isConnected) {
      room.hostId = candidate.id;
      return;
    }
  }
  // Nobody is connected: no host until someone comes back.
  room.hostId = null;
}

function markConnectedChange(room: Room, now: number): void {
  if (countConnected(room) === 0) {
    if (room.emptySince === null) {
      room.emptySince = now;
    }
  } else {
    room.emptySince = null;
  }
}

export function toRoomSnapshot(room: Room): RoomSnapshot {
  const players: LobbyPlayer[] = [];
  for (const player of room.players) {
    players.push({
      id: player.id,
      name: player.name,
      isConnected: player.isConnected,
      isHost: player.id === room.hostId,
    });
  }
  return {
    code: room.code,
    hostId: room.hostId,
    players,
    settings: room.settings,
    // Always strip the pool. The RoomSnapshot type wouldn't accept the full state anyway.
    game: room.game === null ? null : toPublicState(room.game),
    results: room.results,
  };
}

export function toRoomInfo(room: Room): RoomInfo {
  return {
    code: room.code,
    categorySlug: room.settings.categorySlug,
    phase: roomPhase(room),
    playerCount: room.players.length,
    maxPlayers: MAX_PLAYERS,
    joinable: room.game === null && room.players.length < MAX_PLAYERS,
  };
}

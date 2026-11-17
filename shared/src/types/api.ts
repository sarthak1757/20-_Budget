import type { Phase } from "./game";

// Response shapes for the REST API, shared so the client and server agree.

export interface ApiError {
  error: string;
}

export interface CreateRoomResponse {
  code: string;
}

export interface RoomInfo {
  code: string;
  categorySlug: string;
  phase: "lobby" | Phase;
  playerCount: number;
  maxPlayers: number;
  joinable: boolean; // false once the game has started or the room is full
}

export interface LeaderboardEntry {
  name: string;
  wins: number;
  gamesPlayed: number;
  bestScore: number | null; // Classic games with no extras only; null if none played
}

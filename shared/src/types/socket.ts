import type { GameResults, GameSettings, PublicGameState } from "./game";
import type { PublicItem } from "./item";
import type {
  GameSettingsPayload,
  RoomJoinPayload,
  TurnActionPayload,
  VoteCastPayload,
} from "../schemas";

export interface LobbyPlayer {
  id: string;
  name: string;
  isConnected: boolean;
  isHost: boolean;
}

// Everything a client needs to draw the lobby or the game.
// `game` is PublicGameState, so a full GameState (with the pool) can't be put here.
export interface RoomSnapshot {
  code: string;
  hostId: string | null; // null mid-game if the host left (the game keeps running)
  players: LobbyPlayer[];
  settings: GameSettings;
  game: PublicGameState | null;
  results: GameResults | null;
}

// Every client request gets a reply through a Socket.io acknowledgement callback.
export type AckResponse<T> = { ok: true; data: T } | { ok: false; error: string };
export type Ack<T> = (response: AckResponse<T>) => void;

export interface ClientToServerEvents {
  "room:join": (payload: RoomJoinPayload, ack: Ack<{ playerId: string; room: RoomSnapshot }>) => void;
  "room:leave": (ack: Ack<null>) => void;
  "room:settings": (payload: GameSettingsPayload, ack: Ack<null>) => void;
  "game:start": (ack: Ack<null>) => void;
  "turn:action": (payload: TurnActionPayload, ack: Ack<null>) => void;
  "vote:cast": (payload: VoteCastPayload, ack: Ack<null>) => void;
}

export interface ServerToClientEvents {
  "room:update": (room: RoomSnapshot) => void;
  "item:reveal": (payload: { item: PublicItem; state: PublicGameState }) => void;
  "game:state": (state: PublicGameState) => void;
  "game:end": (payload: { state: PublicGameState; results: GameResults }) => void;
  "server:error": (message: string) => void;
}

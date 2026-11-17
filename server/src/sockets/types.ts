import type { Server, Socket } from "socket.io";
import type { AckResponse, ClientToServerEvents, ServerToClientEvents } from "@budget-draft/shared";

// What we remember about each connection after it joins a room.
export interface SocketData {
  roomCode?: string;
  playerId?: string;
}

// Typed with the shared event maps: emitting the wrong payload (for example a
// full GameState with the item pool) is a compile error.
// The third type parameter is for server-to-server events, which we don't use.
export type GameServer = Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;
export type GameSocket = Socket<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;

// A client can forget the callback (or send something else in its place).
// This wraps it so calling it is always safe.
export function safeAck<T>(ack: unknown): (response: AckResponse<T>) => void {
  return (response) => {
    if (typeof ack === "function") {
      ack(response);
    }
  };
}

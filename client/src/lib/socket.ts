import { io, type Socket } from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents } from "@budget-draft/shared";
import { SERVER_URL } from "./api";

export type GameSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

// One socket for the whole app. It only connects when someone enters an
// online room, and Socket.io reconnects it automatically if the network drops.
export const socket: GameSocket = io(SERVER_URL, {
  autoConnect: false,
  transports: ["websocket", "polling"],
});

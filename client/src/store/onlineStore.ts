import { create } from "zustand";
import type { AckResponse, GameSettings, RoomSnapshot, TurnActionPayload, TurnMove } from "@budget-draft/shared";
import type { PeekedItem } from "../lib/peek";
import { forgetRoom, getStoredPlayerId, storeName, storePlayerId } from "../lib/playerStorage";
import { socket } from "../lib/socket";
import { dismissToast, showToast } from "./toastStore";

// The "connection lost" toast stays up until we're back, so we remember its id.
let connectionLostToastId: number | null = null;

export type ConnectionStatus = "idle" | "connecting" | "connected" | "reconnecting";

interface OnlineStore {
  code: string | null;
  name: string;
  playerId: string | null;
  room: RoomSnapshot | null;
  connection: ConnectionStatus;
  joinError: string | null;
  actionError: string | null;
  busy: boolean;
  peeked: PeekedItem | null;

  enterRoom: (code: string, name: string) => void;
  leaveRoom: () => Promise<void>;
  updateSettings: (settings: GameSettings) => Promise<void>;
  startGame: () => Promise<void>;
  act: (move: TurnMove) => Promise<void>;
  peek: () => Promise<void>;
  vote: (targetPlayerId: string) => Promise<void>;
  clearActionError: () => void;
}

// The server owns the game. This store just mirrors the latest snapshot it
// sent and forwards the player's clicks; it never changes game state itself.
export const useOnlineStore = create<OnlineStore>()((set, get) => {
  // Joins (or re-joins) the room for the current code. Sent on every
  // (re)connect, because the server sees a reconnected socket as brand new.
  async function sendJoin(): Promise<void> {
    const { code, name } = get();
    if (code === null) {
      return;
    }
    const playerId = getStoredPlayerId(code);
    const payload = playerId === undefined ? { code, playerName: name } : { code, playerName: name, playerId };
    const response = await socket.emitWithAck("room:join", payload);
    if (response.ok) {
      // Only announce it when coming back from a dropped connection, not on the first join.
      if (get().connection === "reconnecting") {
        if (connectionLostToastId !== null) {
          dismissToast(connectionLostToastId);
          connectionLostToastId = null;
        }
        showToast("Back online", "success");
      }
      storePlayerId(code, response.data.playerId);
      set({ playerId: response.data.playerId, room: response.data.room, joinError: null, connection: "connected" });
    } else {
      if (connectionLostToastId !== null) {
        dismissToast(connectionLostToastId);
        connectionLostToastId = null;
      }
      set({ joinError: response.error, connection: "connected" });
    }
  }

  // Runs an action and shows its error (if any) without throwing.
  async function run(request: () => Promise<AckResponse<null>>): Promise<void> {
    set({ busy: true, actionError: null });
    try {
      const response = await request();
      if (!response.ok) {
        set({ actionError: response.error });
      }
    } catch {
      set({ actionError: "The server didn't answer. Check your connection." });
    } finally {
      set({ busy: false });
    }
  }

  socket.on("connect", () => {
    void sendJoin();
  });
  socket.on("disconnect", (reason) => {
    // "io client disconnect" means we left on purpose (Leave button).
    if (get().code !== null && reason !== "io client disconnect") {
      set({ connection: "reconnecting" });
      connectionLostToastId = showToast("Connection lost. Reconnecting…", "warning", null);
    }
  });
  // The very first connection failed (server down, wrong URL): say so instead of spinning forever.
  // Socket.io keeps retrying in the background, and "connect" will join once it works.
  socket.on("connect_error", () => {
    if (get().connection === "connecting") {
      set({ joinError: "Can't reach the game server. Check your connection and try again." });
    }
  });
  socket.on("room:update", (room) => set({ room }));
  socket.on("game:state", (game) => {
    const room = get().room;
    if (room) set({ room: { ...room, game } });
  });
  socket.on("item:reveal", ({ state }) => {
    const room = get().room;
    if (room) set({ room: { ...room, game: state } });
  });
  socket.on("game:end", ({ state, results }) => {
    const room = get().room;
    if (room) set({ room: { ...room, game: state, results } });
  });

  return {
    code: null,
    name: "",
    playerId: null,
    room: null,
    connection: "idle",
    joinError: null,
    actionError: null,
    busy: false,
    peeked: null,

    enterRoom: (code, name) => {
      const upper = code.toUpperCase();
      storeName(name);
      set({ code: upper, name, room: null, joinError: null, actionError: null, connection: "connecting" });
      if (socket.connected) {
        void sendJoin();
      } else {
        socket.connect(); // "connect" handler sends the join
      }
    },

    leaveRoom: async () => {
      const code = get().code;
      if (socket.connected) {
        await socket.emitWithAck("room:leave").catch(() => undefined);
      }
      if (code !== null) {
        forgetRoom(code);
      }
      socket.disconnect();
      if (connectionLostToastId !== null) {
        dismissToast(connectionLostToastId);
        connectionLostToastId = null;
      }
      set({ code: null, playerId: null, room: null, connection: "idle", joinError: null });
    },

    updateSettings: (settings) => run(() => socket.emitWithAck("room:settings", settings)),
    startGame: () => run(() => socket.emitWithAck("game:start")),
    act: (move) => {
      const roundNumber = get().room?.game?.roundNumber ?? 0;
      let payload: TurnActionPayload;
      if (move.type === "bid") {
        payload = { action: "bid", amount: move.amount, roundNumber };
      } else {
        payload = { action: move.type, roundNumber };
      }
      return run(() => socket.emitWithAck("turn:action", payload));
    },
    peek: async () => {
      const { room, playerId } = get();
      const roundNumber = room?.game?.roundNumber ?? 0;
      if (playerId === null) {
        return;
      }
      set({ busy: true, actionError: null });
      try {
        const response = await socket.emitWithAck("turn:peek", { roundNumber });
        if (response.ok) {
          set({ peeked: { item: response.data.item, playerId, roundNumber } });
        } else {
          set({ actionError: response.error });
        }
      } catch {
        set({ actionError: "The server didn't answer. Check your connection." });
      } finally {
        set({ busy: false });
      }
    },
    vote: (targetPlayerId) => run(() => socket.emitWithAck("vote:cast", { targetPlayerId })),
    clearActionError: () => set({ actionError: null }),
  };
});

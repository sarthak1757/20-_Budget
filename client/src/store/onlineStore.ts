import { create } from "zustand";
import type { AckResponse, GameSettings, RoomSnapshot } from "@budget-draft/shared";
import { forgetRoom, getStoredPlayerId, storeName, storePlayerId } from "../lib/playerStorage";
import { socket } from "../lib/socket";

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

  enterRoom: (code: string, name: string) => void;
  leaveRoom: () => Promise<void>;
  updateSettings: (settings: GameSettings) => Promise<void>;
  startGame: () => Promise<void>;
  act: (action: "buy" | "pass") => Promise<void>;
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
      storePlayerId(code, response.data.playerId);
      set({ playerId: response.data.playerId, room: response.data.room, joinError: null, connection: "connected" });
    } else {
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
  socket.on("disconnect", () => {
    if (get().code !== null) {
      set({ connection: "reconnecting" });
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
      set({ code: null, playerId: null, room: null, connection: "idle", joinError: null });
    },

    updateSettings: (settings) => run(() => socket.emitWithAck("room:settings", settings)),
    startGame: () => run(() => socket.emitWithAck("game:start")),
    act: (action) => {
      const roundNumber = get().room?.game?.roundNumber ?? 0;
      return run(() => socket.emitWithAck("turn:action", { action, roundNumber }));
    },
    vote: (targetPlayerId) => run(() => socket.emitWithAck("vote:cast", { targetPlayerId })),
    clearActionError: () => set({ actionError: null }),
  };
});

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  applyAction,
  castVote,
  createGame,
  decideBotAction,
  endVoting,
  getCurrentPlayerId,
  type GameMode,
  type GameSettings,
  type GameState,
  type Item,
  type NewPlayer,
} from "@budget-draft/shared";
import { whoNeedsDevice } from "../lib/handoff";

// State for games that run entirely in the browser (pass-and-play and bot mode).
// All rules come from the shared engine; this store only keeps the current
// state and calls the engine when a player does something.

export interface StartLocalGameInput {
  mode: Exclude<GameMode, "online">;
  settings: GameSettings;
  players: NewPlayer[];
  items: Item[];
}

interface LocalGameStore {
  game: GameState | null;
  error: string | null;
  // The human who last confirmed "I'm holding the device" (pass-and-play).
  deviceHolderId: string | null;
  // So a finished game is sent to the server only once, even after a refresh.
  resultSubmitted: boolean;

  start: (input: StartLocalGameInput) => void;
  act: (type: "buy" | "pass") => void;
  playBotTurn: () => void;
  vote: (targetId: string) => void;
  finishVoting: () => void;
  confirmHandoff: () => void;
  clearError: () => void;
  markResultSubmitted: () => void;
  reset: () => void;
}

export const useLocalGameStore = create<LocalGameStore>()(
  persist(
    (set, get) => ({
      game: null,
      error: null,
      deviceHolderId: null,
      resultSubmitted: false,

      start: (input) => {
        const game = createGame({ ...input, now: Date.now() });
        set({ game, error: null, deviceHolderId: null, resultSubmitted: false });
      },

      act: (type) => {
        const game = get().game;
        if (!game) {
          return;
        }
        const playerId = getCurrentPlayerId(game);
        if (playerId === null) {
          return;
        }
        const result = applyAction(game, { type, playerId }, Date.now());
        if (result.ok) {
          set({ game: result.state, error: null });
        } else {
          set({ error: result.error });
        }
      },

      // Lets the bot whose turn it is decide, using the shared bot logic.
      playBotTurn: () => {
        const game = get().game;
        if (!game) {
          return;
        }
        const playerId = getCurrentPlayerId(game);
        const bot = game.players.find((player) => player.id === playerId);
        if (playerId === null || !bot || !bot.isBot) {
          return;
        }
        const decision = decideBotAction(game, playerId);
        const result = applyAction(game, { type: decision, playerId }, Date.now());
        if (result.ok) {
          set({ game: result.state });
        }
      },

      vote: (targetId) => {
        const game = get().game;
        if (!game) {
          return;
        }
        const voterId = whoNeedsDevice(game);
        if (voterId === null) {
          return;
        }
        const result = castVote(game, voterId, targetId, Date.now());
        if (result.ok) {
          set({ game: result.state, error: null });
        } else {
          set({ error: result.error });
        }
      },

      finishVoting: () => {
        const game = get().game;
        if (game) {
          set({ game: endVoting(game) });
        }
      },

      confirmHandoff: () => {
        const game = get().game;
        if (game) {
          set({ deviceHolderId: whoNeedsDevice(game) });
        }
      },

      clearError: () => set({ error: null }),

      markResultSubmitted: () => set({ resultSubmitted: true }),

      reset: () => set({ game: null, error: null, deviceHolderId: null }),
    }),
    {
      // sessionStorage: a refresh keeps the game, closing the tab ends it.
      name: "budget-draft-local-game",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        game: state.game,
        deviceHolderId: state.deviceHolderId,
        resultSubmitted: state.resultSubmitted,
      }),
    },
  ),
);

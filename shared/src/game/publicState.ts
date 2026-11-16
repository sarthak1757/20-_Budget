import type { GameState, PublicGameState } from "../types/game";

// Strips the secret item pool before a state is sent to players.
// Clients only learn how many items are left, not which ones.
export function toPublicState(state: GameState): PublicGameState {
  const { itemPool, ...visible } = state;
  return { ...visible, itemsRemaining: itemPool.length };
}

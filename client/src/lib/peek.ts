import type { PublicItem } from "@budget-draft/shared";

// What one player saw with the Peek power-up. Shown only while it's still
// that player's turn on that item, so on a shared device the next person
// doesn't see it.
export interface PeekedItem {
  item: PublicItem;
  playerId: string;
  roundNumber: number;
}

export function isPeekVisible(
  peek: PeekedItem | null,
  roundNumber: number,
  currentPlayerId: string | null,
): peek is PeekedItem {
  return peek !== null && peek.roundNumber === roundNumber && peek.playerId === currentPlayerId;
}

import type { CategorySlug, Item } from "../types/item";
import type { PlayerState } from "../types/game";
import { BENCH_RATING } from "./constants";

export function createBenchItem(category: CategorySlug, playerId: string, slotIndex: number): Item {
  return {
    // Unique per player and slot so React keys and lookups never collide.
    id: `bench-${playerId}-${slotIndex}`,
    name: "Bench Player",
    category,
    price: 0,
    rating: BENCH_RATING,
    tag: "Bench",
    emoji: "🪑",
    isBench: true,
  };
}

// Returns a copy of the player with every empty slot filled by a bench item.
// Used when the item pool runs out before everyone's team is full.
export function fillEmptySlotsWithBench(player: PlayerState, category: CategorySlug): PlayerState {
  const newTeam: (Item | null)[] = [];
  for (let i = 0; i < player.team.length; i++) {
    const slot = player.team[i] ?? null;
    if (slot === null) {
      newTeam.push(createBenchItem(category, player.id, i));
    } else {
      newTeam.push(slot);
    }
  }
  return { ...player, team: newTeam };
}

import type { Item, PublicItem } from "../types/item";
import type { GameEvent, GameState, PlayerState, PublicGameEvent, PublicGameState, PublicPlayerState } from "../types/game";

// What players are allowed to see of an item. While the draft is running a
// mystery item's rating is hidden; once it ends, everything is revealed.
export function toPublicItem(item: Item, draftRunning: boolean): PublicItem {
  if (draftRunning && item.isMystery === true) {
    return { ...item, rating: null };
  }
  return item;
}

function toPublicPlayer(player: PlayerState, draftRunning: boolean): PublicPlayerState {
  const team: (PublicItem | null)[] = [];
  for (const item of player.team) {
    team.push(item === null ? null : toPublicItem(item, draftRunning));
  }
  return { ...player, team };
}

function toPublicEvent(event: GameEvent, draftRunning: boolean): PublicGameEvent {
  return { ...event, item: toPublicItem(event.item, draftRunning) };
}

// Strips the secret item pool before a state is sent to players (clients only
// learn how many items are left) and hides mystery ratings during the draft.
export function toPublicState(state: GameState): PublicGameState {
  const { itemPool, players, currentItem, lastEvents, ...visible } = state;
  const draftRunning = state.phase === "drafting";

  const publicPlayers: PublicPlayerState[] = [];
  for (const player of players) {
    publicPlayers.push(toPublicPlayer(player, draftRunning));
  }
  const publicEvents: PublicGameEvent[] = [];
  for (const event of lastEvents) {
    publicEvents.push(toPublicEvent(event, draftRunning));
  }

  return {
    ...visible,
    itemsRemaining: itemPool.length,
    players: publicPlayers,
    currentItem: currentItem === null ? null : toPublicItem(currentItem, draftRunning),
    lastEvents: publicEvents,
  };
}

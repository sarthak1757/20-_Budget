import type { GameEvent, PlayerState } from "@budget-draft/shared";

function nameOf(players: PlayerState[], playerId: string): string {
  for (const player of players) {
    if (player.id === playerId) {
      return player.name;
    }
  }
  return "Someone";
}

// Turns engine events into short sentences for the activity line on the board.
export function describeEvent(event: GameEvent, players: PlayerState[]): string {
  if (event.type === "bought") {
    return `${nameOf(players, event.playerId)} bought ${event.item.name} for $${event.item.price}`;
  }
  if (event.type === "passed") {
    const who = nameOf(players, event.playerId);
    if (event.auto) {
      return `${who} ran out of time and passed`;
    }
    return `${who} passed on ${event.item.name}`;
  }
  return `Nobody bought ${event.item.name}, so it's gone`;
}

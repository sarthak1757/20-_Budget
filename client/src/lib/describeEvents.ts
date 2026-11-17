import type { PublicGameEvent, PublicPlayerState } from "@budget-draft/shared";

function nameOf(players: PublicPlayerState[], playerId: string): string {
  for (const player of players) {
    if (player.id === playerId) {
      return player.name;
    }
  }
  return "Someone";
}

// Turns engine events into short sentences for the activity line on the board.
export function describeEvent(event: PublicGameEvent, players: PublicPlayerState[]): string {
  if (event.type === "bought") {
    // event.price, not item.price: auctions and discounts change what was paid.
    return `${nameOf(players, event.playerId)} bought ${event.item.name} for $${event.price}`;
  }
  if (event.type === "bid") {
    return `${nameOf(players, event.playerId)} bid $${event.amount}`;
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

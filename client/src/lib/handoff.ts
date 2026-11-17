import { countHumans, getCurrentPlayerId, type GameState } from "@budget-draft/shared";

// Pass-and-play: works out which human should be holding the phone right now.
// - drafting: the player whose turn it is (unless it's a bot)
// - voting: the first human, in seat order, who hasn't voted yet
// - finished: nobody in particular
export function whoNeedsDevice(state: GameState): string | null {
  if (state.phase === "drafting") {
    const currentId = getCurrentPlayerId(state);
    for (const player of state.players) {
      if (player.id === currentId && !player.isBot) {
        return player.id;
      }
    }
    return null;
  }

  if (state.phase === "voting") {
    for (const player of state.players) {
      if (!player.isBot && state.votes[player.id] === undefined) {
        return player.id;
      }
    }
  }
  return null;
}

// Show the "pass the device" screen when a different human needs the phone
// than the one who last confirmed they're holding it. With only one human
// (bot mode) there's nobody to pass to, so we never show it.
export function needsHandoff(state: GameState, deviceHolderId: string | null): boolean {
  if (countHumans(state.players) < 2) {
    return false;
  }
  const nextHolder = whoNeedsDevice(state);
  if (nextHolder === null) {
    return false;
  }
  return nextHolder !== deviceHolderId;
}

import type { GameSettings } from "../types/game";

// How long one turn lasts: Classic uses the turn timer, Auction the bid timer.
// 0 means no timer (pass-and-play and games against bots).
export function secondsPerTurn(settings: GameSettings): number {
  const seconds = settings.draftStyle === "auction" ? settings.bidSeconds : settings.turnSeconds;
  // Local games saved before the bid timer existed have no bidSeconds at all.
  if (typeof seconds !== "number" || seconds <= 0) {
    return 0;
  }
  return seconds;
}

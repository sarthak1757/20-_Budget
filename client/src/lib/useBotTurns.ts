import { useEffect } from "react";
import { getCurrentPlayerId, type GameState } from "@budget-draft/shared";

// How long a bot "thinks" before acting. Instant moves feel robotic and
// make it hard to see what happened, so we wait a little, with some variety.
const MIN_THINK_MS = 700;
const EXTRA_THINK_MS = 600;

// When it's a bot's turn, waits a moment and then calls playBotTurn.
// The effect re-runs whenever the game changes, so bots play one after another.
export function useBotTurns(game: GameState | null, playBotTurn: () => void): boolean {
  let botIsThinking = false;
  if (game !== null && game.phase === "drafting") {
    const currentId = getCurrentPlayerId(game);
    for (const player of game.players) {
      if (player.id === currentId && player.isBot) {
        botIsThinking = true;
      }
    }
  }

  useEffect(() => {
    if (!botIsThinking) {
      return;
    }
    const delay = MIN_THINK_MS + Math.random() * EXTRA_THINK_MS;
    const timer = setTimeout(playBotTurn, delay);
    // If the game changes or the page closes first, cancel the pending move.
    return () => clearTimeout(timer);
  }, [game, botIsThinking, playBotTurn]);

  return botIsThinking;
}

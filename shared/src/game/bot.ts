import type { BotDifficulty, GameState } from "../types/game";
import { decideEasy } from "./bots/easy";
import { makeBotView } from "./bots/view";
import type { TurnMove } from "./engine";

export { BOT_VALUE_THRESHOLD } from "./bots/easy";
export { guessRatingFromPrice } from "./bots/view";

// Decides what the bot whose turn it is should do, at the game's difficulty.
// The strategies only ever see a BotView (public state + the unseen items
// without their order), never this full state: bots can't cheat.
export function decideBotAction(state: GameState, botId: string): TurnMove {
  return decideBotMoveAt(state, botId, state.settings.botDifficulty);
}

// Same, at a chosen difficulty. Simulations use this to seat an easy bot
// and a hard bot in the same game.
export function decideBotMoveAt(state: GameState, botId: string, difficulty: BotDifficulty): TurnMove {
  const view = makeBotView(state, botId);
  // Medium and Hard are added in the next commits.
  void difficulty;
  return decideEasy(view);
}

import type { PublicItem } from "../types/item";
import type { AuctionState, GameSettings, Phase, PlayerState, PowerUp } from "../types/game";
import { DISCOUNT_AMOUNT } from "./constants";
import { getSpendBlockReason } from "./rules";

// Power-ups: each player can use each one once per game, on their own turn.
// - Veto: throw the current item away before anyone has bought or bid.
// - Discount (Classic only): buy the current item for $2 less, minimum $1.
// - Peek: see the next item before deciding. Only the player who peeks sees it.

export const POWER_UPS: PowerUp[] = ["veto", "discount", "peek"];

export function discountedPrice(price: number): number {
  return Math.max(1, price - DISCOUNT_AMOUNT);
}

export function hasPowerUp(player: PlayerState<PublicItem>, powerUp: PowerUp): boolean {
  return !player.usedPowerUps.includes(powerUp);
}

// The parts of a game a power-up check needs. Both GameState and
// PublicGameState fit, so the server and the UI use the same check.
export interface PowerUpContext {
  settings: GameSettings;
  phase: Phase;
  turnQueue: string[];
  auction: AuctionState | null;
  currentItem: { price: number } | null;
  players: PlayerState<PublicItem>[];
}

// Why this player can't use this power-up right now, or null if they can.
// `itemsLeft` is how many unrevealed items remain (Peek needs at least one).
export function getPowerUpBlockReason(
  game: PowerUpContext,
  playerId: string,
  powerUp: PowerUp,
  itemsLeft: number,
): string | null {
  if (!game.settings.powerUps) {
    return "Power-ups are off in this game";
  }
  if (game.phase !== "drafting" || game.currentItem === null) {
    return "The draft is over";
  }
  if (game.turnQueue[0] !== playerId) {
    return "Power-ups can only be used on your turn";
  }
  const player = game.players.find((p) => p.id === playerId);
  if (!player) {
    return "Unknown player";
  }
  if (!hasPowerUp(player, powerUp)) {
    return "You've already used that one";
  }

  if (powerUp === "veto") {
    // In Classic nobody can have bought yet (a buy ends the round), so only bids matter.
    if (game.auction !== null && game.auction.highBidderId !== null) {
      return "Too late: someone has already bid";
    }
    return null;
  }

  if (powerUp === "discount") {
    if (game.auction !== null) {
      return "Discount is only for Classic games";
    }
    return getSpendBlockReason(player, discountedPrice(game.currentItem.price));
  }

  // Peek
  if (itemsLeft === 0) {
    return "There are no more items to peek at";
  }
  return null;
}

import { Ban, BadgePercent, Eye, type LucideIcon } from "lucide-react";
import { getPowerUpBlockReason, POWER_UPS, type PowerUp, type PublicGameState } from "@budget-draft/shared";
import { ICON_STROKE } from "./brand/primitives";

const LABELS: Record<PowerUp, { Icon: LucideIcon; name: string; help: string }> = {
  veto: { Icon: Ban, name: "Veto", help: "Throw this item away before anyone buys or bids" },
  discount: { Icon: BadgePercent, name: "Discount", help: "Buy this item for $2 less (minimum $1)" },
  peek: { Icon: Eye, name: "Peek", help: "See the next item. Only you see it." },
};

interface PowerUpBarProps {
  state: PublicGameState;
  playerId: string | null; // whose power-ups to show: the viewer online, the current player locally
  canAct: boolean;
  busy?: boolean;
  onUse: (powerUp: PowerUp) => void;
}

// One pill per power-up. A used power-up stays visible but faded,
// so everyone can see what's still available.
export function PowerUpBar({ state, playerId, canAct, busy = false, onUse }: PowerUpBarProps) {
  if (!state.settings.powerUps || playerId === null) {
    return null;
  }
  const player = state.players.find((p) => p.id === playerId);
  if (!player) {
    return null;
  }

  return (
    <div className="flex flex-wrap justify-center gap-2" aria-label="Power-ups" role="group">
      {POWER_UPS.map((powerUp) => {
        // Discount doesn't exist in auctions, so don't show a button that can never work.
        if (powerUp === "discount" && state.auction !== null) {
          return null;
        }
        const { Icon, name, help } = LABELS[powerUp];
        const used = player.usedPowerUps.includes(powerUp);
        const blockReason = getPowerUpBlockReason(state, playerId, powerUp, state.itemsRemaining);
        const disabled = !canAct || busy || blockReason !== null;
        return (
          <button
            key={powerUp}
            type="button"
            disabled={disabled}
            onClick={() => onUse(powerUp)}
            title={used ? `${name} used` : (blockReason ?? help)}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 ring-1 transition disabled:cursor-not-allowed ${used ? "text-platinum/50 ring-platinum/20 line-through" : "text-platinum ring-platinum/60 enabled:hover:bg-mocha-light disabled:opacity-60"}`}
          >
            <Icon size={16} strokeWidth={ICON_STROKE} className="text-lavender-deep" aria-hidden />
            <span className="label-caps">{name}</span>
          </button>
        );
      })}
    </div>
  );
}

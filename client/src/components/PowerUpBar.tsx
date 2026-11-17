import { getPowerUpBlockReason, POWER_UPS, type PowerUp, type PublicGameState } from "@budget-draft/shared";

const LABELS: Record<PowerUp, { icon: string; name: string; help: string }> = {
  veto: { icon: "🚫", name: "Veto", help: "Throw this item away before anyone buys or bids" },
  discount: { icon: "💸", name: "Discount", help: "Buy this item for $2 less (minimum $1)" },
  peek: { icon: "👀", name: "Peek", help: "See the next item. Only you see it." },
};

interface PowerUpBarProps {
  state: PublicGameState;
  playerId: string | null; // whose power-ups to show: the viewer online, the current player locally
  canAct: boolean;
  busy?: boolean;
  onUse: (powerUp: PowerUp) => void;
}

// One button per power-up. A used power-up stays visible but greyed out,
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
    <div className="grid grid-cols-3 gap-2" aria-label="Power-ups">
      {POWER_UPS.map((powerUp) => {
        // Discount doesn't exist in auctions, so don't show a button that can never work.
        if (powerUp === "discount" && state.auction !== null) {
          return null;
        }
        const label = LABELS[powerUp];
        const used = player.usedPowerUps.includes(powerUp);
        const blockReason = getPowerUpBlockReason(state, playerId, powerUp, state.itemsRemaining);
        const disabled = !canAct || busy || blockReason !== null;
        return (
          <button
            key={powerUp}
            type="button"
            disabled={disabled}
            onClick={() => onUse(powerUp)}
            title={used ? `${label.name} used` : (blockReason ?? label.help)}
            className={`rounded-xl border px-2 py-2 text-sm font-semibold transition enabled:hover:border-violet-400 disabled:cursor-not-allowed ${used ? "border-zinc-800 bg-zinc-900 text-zinc-600 line-through" : "border-violet-700 bg-violet-950/40 text-violet-100 disabled:opacity-50"}`}
          >
            <span aria-hidden>{label.icon}</span> {label.name}
          </button>
        );
      })}
    </div>
  );
}

import { Ban, BadgePercent, Eye, type LucideIcon } from "lucide-react";
import { useState } from "react";
import { getPowerUpBlockReason, POWER_UPS, type PowerUp, type PublicGameState } from "@budget-draft/shared";
import { ICON_STROKE, Label, PillButton, UrgentNote } from "./brand/primitives";
import { Sheet } from "./Sheet";

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
  // Phones: a tap opens a sheet that explains the power-up, with a Use button.
  // Each power-up works once, so a stray tap shouldn't spend it.
  compact?: boolean;
  onUse: (powerUp: PowerUp) => void;
}

interface PowerUpStatus {
  powerUp: PowerUp;
  used: boolean;
  blockReason: string | null;
  disabled: boolean;
}

// One pill per power-up. A used power-up stays visible but faded,
// so everyone can see what's still available.
export function PowerUpBar({ state, playerId, canAct, busy = false, compact = false, onUse }: PowerUpBarProps) {
  const [infoFor, setInfoFor] = useState<PowerUp | null>(null);
  if (!state.settings.powerUps || playerId === null) {
    return null;
  }
  const player = state.players.find((p) => p.id === playerId);
  if (!player) {
    return null;
  }

  const statuses: PowerUpStatus[] = [];
  for (const powerUp of POWER_UPS) {
    // Discount doesn't exist in auctions, so don't show a button that can never work.
    if (powerUp === "discount" && state.auction !== null) {
      continue;
    }
    const blockReason = getPowerUpBlockReason(state, playerId, powerUp, state.itemsRemaining);
    statuses.push({
      powerUp,
      used: player.usedPowerUps.includes(powerUp),
      blockReason,
      disabled: !canAct || busy || blockReason !== null,
    });
  }

  if (!compact) {
    return (
      <div className="flex flex-wrap justify-center gap-2" aria-label="Power-ups" role="group">
        {statuses.map(({ powerUp, used, blockReason, disabled }) => {
          const { Icon, name, help } = LABELS[powerUp];
          return (
            <button
              key={powerUp}
              type="button"
              disabled={disabled}
              onClick={() => onUse(powerUp)}
              title={used ? `${name} used` : (blockReason ?? help)}
              className={`inline-flex min-h-11 items-center gap-2 rounded-full px-4 py-2 ring-1 transition disabled:cursor-not-allowed ${used ? "text-mist/50 ring-mist/20 line-through" : "text-mist ring-mist/60 enabled:hover:bg-ink-hover disabled:opacity-60"}`}
            >
              <Icon size={16} strokeWidth={ICON_STROKE} className="text-gold" aria-hidden />
              <span className="label-caps">{name}</span>
            </button>
          );
        })}
      </div>
    );
  }

  let open: PowerUpStatus | undefined;
  for (const status of statuses) {
    if (status.powerUp === infoFor) {
      open = status;
    }
  }

  return (
    <>
      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${statuses.length}, minmax(0, 1fr))` }}
        aria-label="Power-ups"
        role="group"
      >
        {statuses.map(({ powerUp, used, disabled }) => {
          const { Icon, name } = LABELS[powerUp];
          // Always tappable, even when it can't be used right now: the sheet says why.
          return (
            <button
              key={powerUp}
              type="button"
              onClick={() => setInfoFor(powerUp)}
              aria-label={`${name}${used ? " (used)" : ""}: what it does`}
              aria-haspopup="dialog"
              className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-1.5 ring-1 transition active:scale-[0.97] ${compactTone(used, disabled)}`}
            >
              <Icon size={16} strokeWidth={ICON_STROKE} className={used ? "text-mist/50" : "text-gold"} aria-hidden />
              <span className="label-caps tracking-[0.1em]">{name}</span>
            </button>
          );
        })}
      </div>
      <Sheet open={open !== undefined} onClose={() => setInfoFor(null)} title="Power-up">
        {open && (
          <PowerUpInfo
            status={open}
            canAct={canAct}
            onUse={() => {
              setInfoFor(null);
              onUse(open.powerUp);
            }}
          />
        )}
      </Sheet>
    </>
  );
}

// Used: struck through. Not usable right now: dimmer. Ready: ivory.
function compactTone(used: boolean, disabled: boolean): string {
  if (used) {
    return "text-mist/50 ring-mist/20 line-through";
  }
  if (disabled) {
    return "text-mist/70 ring-mist/30";
  }
  return "text-ivory ring-mist/60";
}

function PowerUpInfo({ status, canAct, onUse }: { status: PowerUpStatus; canAct: boolean; onUse: () => void }) {
  const { Icon, name, help } = LABELS[status.powerUp];
  let note: string | null = null;
  if (status.used) {
    note = "You've already used this one.";
  } else if (!canAct) {
    note = "You can use it on your turn.";
  } else if (status.blockReason !== null) {
    note = status.blockReason;
  }
  return (
    <div className="grid gap-5">
      <div className="flex items-center gap-3">
        <Icon size={28} strokeWidth={ICON_STROKE} className="shrink-0 text-gold" aria-hidden />
        <h2 className="display-serif text-4xl text-ivory">{name}</h2>
      </div>
      <p className="text-mist">{help}. Each power-up works once per game.</p>
      {note !== null && (
        <p>
          <UrgentNote>{note}</UrgentNote>
        </p>
      )}
      <PillButton className="py-4 text-lg" disabled={status.disabled} onClick={onUse}>
        Use {name}
      </PillButton>
      <Label className="text-center text-mist/70">Tap outside to close</Label>
    </div>
  );
}

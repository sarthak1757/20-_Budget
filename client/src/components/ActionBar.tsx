import { Label, PillButton, UrgentNote } from "./brand/primitives";

interface ActionBarProps {
  turnLabel: string; // "Asha's turn" or "Your turn"
  canAct: boolean; // false while it's someone else's turn (online) or a bot is thinking
  buyBlockReason: string | null; // why BUY is disabled, if it is
  busy?: boolean; // waiting for the server to answer
  onBuy: () => void;
  onPass: () => void;
}

export function ActionBar({ turnLabel, canAct, buyBlockReason, busy = false, onBuy, onPass }: ActionBarProps) {
  return (
    <div className="grid gap-3">
      <p className="text-center">
        <Label className={canAct ? "text-lavender" : ""}>{turnLabel}</Label>
      </p>
      <div className="grid grid-cols-2 gap-3">
        <PillButton className="py-4 text-lg tracking-[0.15em]" disabled={!canAct || busy || buyBlockReason !== null} onClick={onBuy}>
          BUY
        </PillButton>
        <PillButton variant="secondary" className="py-4 text-lg tracking-[0.15em]" disabled={!canAct || busy} onClick={onPass}>
          PASS
        </PillButton>
      </div>
      {canAct && buyBlockReason !== null && (
        <p className="text-center">
          <UrgentNote>{buyBlockReason}</UrgentNote>
        </p>
      )}
    </div>
  );
}

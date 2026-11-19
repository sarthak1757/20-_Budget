import { PillButton, UrgentNote } from "./brand/primitives";

interface ActionBarProps {
  canAct: boolean; // false while it's someone else's turn (online) or a bot is thinking
  buyBlockReason: string | null; // why BUY is disabled, if it is
  busy?: boolean; // waiting for the server to answer
  onBuy: () => void;
  onPass: () => void;
}

// BUY and PASS. The turn label above them is drawn by the board.
export function ActionBar({ canAct, buyBlockReason, busy = false, onBuy, onPass }: ActionBarProps) {
  return (
    <div className="grid gap-3">
      <div className="grid grid-cols-2 gap-3">
        <PillButton
          className="py-3.5 text-lg tracking-[0.15em] md:py-4"
          disabled={!canAct || busy || buyBlockReason !== null}
          onClick={onBuy}
        >
          BUY
        </PillButton>
        <PillButton
          variant="secondary"
          className="py-3.5 text-lg tracking-[0.15em] md:py-4"
          disabled={!canAct || busy}
          onClick={onPass}
        >
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

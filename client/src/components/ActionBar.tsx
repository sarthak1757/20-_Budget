import { Button } from "./ui";

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
    <div className="grid gap-2">
      <p className="text-center font-semibold text-zinc-300">{turnLabel}</p>
      <div className="grid grid-cols-2 gap-3">
        <Button
          className="py-4 text-xl font-black tracking-wide"
          disabled={!canAct || busy || buyBlockReason !== null}
          onClick={onBuy}
        >
          BUY
        </Button>
        <Button variant="secondary" className="py-4 text-xl font-black tracking-wide" disabled={!canAct || busy} onClick={onPass}>
          PASS
        </Button>
      </div>
      {canAct && buyBlockReason !== null && <p className="text-center text-sm text-amber-400">{buyBlockReason}</p>}
    </div>
  );
}

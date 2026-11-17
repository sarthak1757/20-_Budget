import { getBidBlockReason, minimumBid, type AuctionState, type PlayerState } from "@budget-draft/shared";
import { Button } from "./ui";

// Quick-bid steps: one tap raises the high bid by this much.
export const QUICK_BID_STEPS = [1, 2, 5];

interface BidBarProps {
  turnLabel: string;
  auction: AuctionState;
  highBidderName: string | null;
  bidder: PlayerState | undefined; // whose budget the buttons are checked against
  canAct: boolean;
  busy?: boolean;
  onBid: (amount: number) => void;
  onPass: () => void;
}

// The auction version of the BUY/PASS bar.
export function BidBar({ turnLabel, auction, highBidderName, bidder, canAct, busy = false, onBid, onPass }: BidBarProps) {
  const minimum = minimumBid(auction);

  // Why the smallest bid is blocked, shown under the buttons (e.g. the budget rule).
  let blockReason: string | null = null;
  if (bidder) {
    blockReason = getBidBlockReason(bidder, auction, minimum);
  }

  return (
    <div className="grid gap-2">
      <p className="text-center font-semibold text-zinc-300">{turnLabel}</p>
      <p className="text-center text-sm text-zinc-400" aria-live="polite">
        {auction.highBidderId === null ? (
          <>No bids yet. Opening bid ${minimum}.</>
        ) : (
          <>
            High bid <span className="text-money text-lg font-black">${auction.highBid}</span> by {highBidderName}
          </>
        )}
      </p>
      <div className="grid grid-cols-3 gap-2">
        {QUICK_BID_STEPS.map((step) => {
          // With no bids yet, "+$1" means "open at $1".
          const amount = auction.highBid + step;
          const blocked = bidder === undefined || getBidBlockReason(bidder, auction, amount) !== null;
          return (
            <Button
              key={step}
              className="py-4 text-lg font-black"
              disabled={!canAct || busy || blocked}
              onClick={() => onBid(amount)}
              aria-label={`Bid $${amount}`}
            >
              ${amount}
              <span className="block text-xs font-semibold opacity-70">+${step}</span>
            </Button>
          );
        })}
      </div>
      <Button variant="secondary" className="py-3 text-lg font-black tracking-wide" disabled={!canAct || busy} onClick={onPass}>
        PASS
      </Button>
      {canAct && blockReason !== null && <p className="text-center text-sm text-amber-400">{blockReason}</p>}
    </div>
  );
}

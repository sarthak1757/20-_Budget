import { getBidBlockReason, minimumBid, type AuctionState, type PublicPlayerState } from "@budget-draft/shared";
import { Label, PillButton, UrgentNote } from "./brand/primitives";

// Quick-bid steps: one tap raises the high bid by this much.
export const QUICK_BID_STEPS = [1, 2, 5];

interface BidBarProps {
  turnLabel: string;
  auction: AuctionState;
  highBidderName: string | null;
  bidder: PublicPlayerState | undefined; // whose budget the buttons are checked against
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
    <div className="grid gap-3">
      <p className="text-center">
        <Label className={canAct ? "text-ivory" : ""}>{turnLabel}</Label>
      </p>
      <p className="flex items-baseline justify-center gap-3 text-center" aria-live="polite">
        {auction.highBidderId === null ? (
          <Label>No bids yet · opening bid ${minimum}</Label>
        ) : (
          <>
            <Label>High bid · {highBidderName}</Label>
            <span className="display-serif text-4xl text-ivory">${auction.highBid}</span>
          </>
        )}
      </p>
      <div className="grid grid-cols-3 gap-2">
        {QUICK_BID_STEPS.map((step) => {
          // With no bids yet, "+$1" means "open at $1".
          const amount = auction.highBid + step;
          const blocked = bidder === undefined || getBidBlockReason(bidder, auction, amount) !== null;
          return (
            <PillButton
              key={step}
              className="grid gap-0 px-2 py-3 text-lg leading-tight"
              disabled={!canAct || busy || blocked}
              onClick={() => onBid(amount)}
              aria-label={`Bid $${amount}`}
            >
              ${amount}
              <span className="label-caps opacity-80">+${step}</span>
            </PillButton>
          );
        })}
      </div>
      <PillButton variant="secondary" className="py-3 text-lg tracking-[0.15em]" disabled={!canAct || busy} onClick={onPass}>
        PASS
      </PillButton>
      {canAct && blockReason !== null && (
        <p className="text-center">
          <UrgentNote>{blockReason}</UrgentNote>
        </p>
      )}
    </div>
  );
}

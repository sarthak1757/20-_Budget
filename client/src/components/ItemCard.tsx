import type { PublicItem } from "@budget-draft/shared";
import { ChromeBlob } from "./brand/ChromeBlob";
import { Hairline, Label, PriceBadge, RatingBar } from "./brand/primitives";

interface ItemCardProps {
  item: PublicItem;
  roundNumber: number;
  itemsRemaining: number;
  isAuction?: boolean; // the listed price is only a guide: bids decide what's paid
}

export function ItemCard({ item, roundNumber, itemsRemaining, isAuction = false }: ItemCardProps) {
  return (
    // The parent renders this with key={item.id}, so each new item mounts a fresh card
    // and the reveal animation plays again.
    <article
      className="animate-card-flip relative grid content-start gap-5 overflow-hidden rounded-[2rem] border border-mist/15 bg-ink-raised p-5"
      aria-live="polite"
    >
      <div className="flex items-center justify-between gap-3">
        <Label>
          Item {roundNumber} · {itemsRemaining} left
        </Label>
        <Label className="truncate text-ivory">
          {item.emoji !== undefined && <span aria-hidden>{item.emoji} </span>}
          {item.tag}
        </Label>
      </div>

      {item.isMystery && (
        // A mystery item hides its rating: a big serif "?" floats over a chrome shape.
        <div className="relative grid h-28 place-items-center">
          <ChromeBlob shape="pebble" className="absolute w-28" />
          <span className="display-serif relative text-[6rem] text-ivory [-webkit-text-stroke:2px_var(--color-ink-raised)] [paint-order:stroke_fill] [text-shadow:0_2px_12px_var(--color-ink-raised)]">
            ?
          </span>
        </div>
      )}

      <h2 className="display-serif text-4xl text-ivory">{item.name}</h2>
      {item.isMystery && <Label className="text-gold">Mystery · rating revealed at the end</Label>}

      <Hairline />
      <div className="flex items-end gap-5">
        <PriceBadge price={item.price} label={isAuction ? "Guide price" : "Price"} />
        <RatingBar rating={item.rating} className="flex-1 pb-7" />
      </div>
    </article>
  );
}

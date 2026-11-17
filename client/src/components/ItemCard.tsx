import type { Item } from "@budget-draft/shared";
import { Avatar } from "./Avatar";

interface ItemCardProps {
  item: Item;
  roundNumber: number;
  itemsRemaining: number;
  isAuction?: boolean; // the listed price is only a guide: bids decide what's paid
}

export function ItemCard({ item, roundNumber, itemsRemaining, isAuction = false }: ItemCardProps) {
  return (
    // The parent renders this with key={item.id}, so each new item mounts a fresh card
    // and the reveal animation plays again.
    <article
      className="animate-card-flip rounded-3xl border border-zinc-700 bg-gradient-to-b from-zinc-800 to-zinc-900 p-5 text-center shadow-xl"
      aria-live="polite"
    >
      <p className="text-xs tracking-widest text-zinc-500 uppercase">
        Item {roundNumber} · {itemsRemaining} left
      </p>
      <div className="mt-4 flex justify-center">
        <Avatar name={item.name} emoji={item.emoji} size="lg" />
      </div>
      <h2 className="mt-3 text-2xl leading-tight font-black">{item.name}</h2>
      <p className="mt-1 text-sm text-zinc-400">{item.tag}</p>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-zinc-950/60 p-3">
          <p className="text-xs text-zinc-500 uppercase">{isAuction ? "Guide price" : "Price"}</p>
          <p className="text-money text-3xl font-black tabular-nums">${item.price}</p>
        </div>
        <div className="rounded-2xl bg-zinc-950/60 p-3">
          <p className="text-xs text-zinc-500 uppercase">Rating</p>
          <p className="text-3xl font-black tabular-nums">{item.rating}</p>
        </div>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-800" aria-hidden>
        <div className="h-full rounded-full bg-emerald-400" style={{ width: `${item.rating}%` }} />
      </div>
    </article>
  );
}

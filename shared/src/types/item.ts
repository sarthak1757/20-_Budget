// A category slug is the URL-friendly id of a category, e.g. "football".
export type CategorySlug = string;

// One thing a player can buy: a footballer, a burger, a superhero...
export interface Item {
  id: string;
  name: string;
  category: CategorySlug;
  price: number; // whole dollars, 1–10 (bench items are 0)
  rating: number; // 1–100
  tag: string; // short role label, e.g. "Striker"
  emoji?: string; // optional; the UI falls back to an initials avatar
  isBench?: boolean; // true for the $0 filler items added when the pool runs out
  isMystery?: boolean; // Mystery items: the rating stays hidden until the draft ends
  // Set when the item joins a team: what was actually paid. Differs from
  // `price` after an auction or a Discount.
  paidPrice?: number;
}

// What the owner paid for an item on their team (the listed price if unknown).
export function pricePaid(item: { price: number; paidPrice?: number }): number {
  return item.paidPrice ?? item.price;
}

// An item as players see it. A mystery item's rating is null until the
// draft ends, so the UI is forced (by the compiler) to handle "unknown".
export type PublicItem = Omit<Item, "rating"> & { rating: number | null };

export interface Category {
  slug: CategorySlug;
  name: string;
  emoji: string;
  description: string;
  itemCount: number;
  roles: string[]; // for "Balanced team"; empty = this category has no roles
}

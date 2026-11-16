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
}

export interface Category {
  slug: CategorySlug;
  name: string;
  emoji: string;
  description: string;
  itemCount: number;
}

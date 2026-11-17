// The "fair" price for a rating. Seed data follows this roughly, so price is
// a decent hint of quality. The exceptions (bargains and overpriced items)
// are what make the draft interesting: spotting them is the skill.
export function expectedPrice(rating: number): number {
  if (rating >= 95) return 10;
  if (rating >= 90) return 9;
  if (rating >= 85) return 8;
  if (rating >= 80) return 7;
  if (rating >= 75) return 6;
  if (rating >= 70) return 5;
  if (rating >= 65) return 4;
  if (rating >= 60) return 3;
  if (rating >= 55) return 2;
  return 1;
}

// How far from the fair price an item must be to count as a deliberate deal or rip-off.
export const PRICE_SURPRISE_GAP = 3;

export type PriceClass = "fair" | "bargain" | "overpriced";

export function classifyPrice(price: number, rating: number): PriceClass {
  const fair = expectedPrice(rating);
  if (price <= fair - PRICE_SURPRISE_GAP) {
    return "bargain";
  }
  if (price >= fair + PRICE_SURPRISE_GAP) {
    return "overpriced";
  }
  return "fair";
}

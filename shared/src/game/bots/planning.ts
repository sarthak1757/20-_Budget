import { BENCH_RATING } from "../constants";
import type { UnseenItem } from "./view";

// Planning for the Hard bot.
//
// A pick is worth (rating − price): at the end every $1 left over is worth
// 1 point, so spending $1 costs exactly 1 point. A "plan" is the best set of
// future picks for the bot's empty slots that it can afford.
//
// This is a small knapsack: choose up to `maxSlots` items, total price no
// more than the budget, for the highest total value. The table answers that
// question for EVERY slot count and budget at once, so the bot can compare
// "buy now at $p" with "wait" for every p from one table.

export interface PlanTable {
  // best[slots][budget] = best total value using exactly `slots` items costing at most `budget`.
  // -Infinity means "not possible".
  best: number[][];
  candidateCount: number;
}

export function buildPlanTable(candidates: UnseenItem[], maxSlots: number, maxBudget: number): PlanTable {
  const best: number[][] = [];
  for (let slots = 0; slots <= maxSlots; slots++) {
    const row: number[] = [];
    for (let budget = 0; budget <= maxBudget; budget++) {
      row.push(slots === 0 ? 0 : -Infinity);
    }
    best.push(row);
  }

  for (const item of candidates) {
    const value = item.rating - item.price;
    // Go downwards so each item is used at most once (classic 0/1 knapsack).
    for (let slots = maxSlots; slots >= 1; slots--) {
      const row = best[slots] as number[];
      const smaller = best[slots - 1] as number[];
      for (let budget = maxBudget; budget >= item.price; budget--) {
        const withItem = (smaller[budget - item.price] as number) + value;
        if (withItem > (row[budget] as number)) {
          row[budget] = withItem;
        }
      }
    }
  }
  return { best, candidateCount: candidates.length };
}

// The value of the best plan to fill `slots` slots with `budget` dollars.
// If there aren't enough candidates, the rest become bench players (rating 10, free).
export function planValue(table: PlanTable, slots: number, budget: number): number {
  if (slots <= 0) {
    return 0;
  }
  if (budget < 0) {
    return -Infinity;
  }
  const benchNeeded = Math.max(0, slots - table.candidateCount);
  let bestValue = -Infinity;
  for (let realPicks = slots - benchNeeded; realPicks <= slots; realPicks++) {
    const row = table.best[realPicks];
    if (row === undefined) {
      continue;
    }
    const cappedBudget = Math.min(budget, row.length - 1);
    const value = (row[cappedBudget] as number) + (slots - realPicks) * BENCH_RATING;
    if (value > bestValue) {
      bestValue = value;
    }
  }
  return bestValue;
}

// Other players want the good items too, so the bot can't plan on getting
// all of them. It assumes it gets one in every `share` of the best items
// (share = number of players still drafting), like taking turns in a draft.
export function itemsTheBotMightGet(unseen: UnseenItem[], share: number): UnseenItem[] {
  const byValue = [...unseen];
  byValue.sort((a, b) => b.rating - b.price - (a.rating - a.price));
  const mine: UnseenItem[] = [];
  for (let i = 0; i < byValue.length; i++) {
    if (i % share === 0) {
      mine.push(byValue[i] as UnseenItem);
    }
  }
  return mine;
}

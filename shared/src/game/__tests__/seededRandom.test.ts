import { describe, expect, it } from "vitest";
import { createSeededRandom, hashString } from "../seededRandom";

function take(random: () => number, count: number): number[] {
  const values: number[] = [];
  for (let i = 0; i < count; i++) {
    values.push(random());
  }
  return values;
}

describe("createSeededRandom", () => {
  it("gives the same sequence for the same seed", () => {
    expect(take(createSeededRandom(42), 5)).toEqual(take(createSeededRandom(42), 5));
  });

  it("gives different sequences for different seeds", () => {
    expect(take(createSeededRandom(1), 5)).not.toEqual(take(createSeededRandom(2), 5));
  });

  it("stays in [0, 1) and spreads values out", () => {
    const values = take(createSeededRandom(7), 10_000);
    let low = 0;
    for (const value of values) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
      if (value < 0.5) low += 1;
    }
    // Roughly half below 0.5.
    expect(low).toBeGreaterThan(4_700);
    expect(low).toBeLessThan(5_300);
  });
});

describe("hashString", () => {
  it("is stable and sensitive to every character", () => {
    expect(hashString("2026-11-18")).toBe(hashString("2026-11-18"));
    expect(hashString("2026-11-18")).not.toBe(hashString("2026-11-19"));
  });
});

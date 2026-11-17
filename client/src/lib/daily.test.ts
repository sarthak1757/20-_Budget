import { describe, expect, it } from "vitest";
import { createDailyGame } from "@budget-draft/shared";
import { bundledSeeds } from "../data/bundledCategories";
import { buildShareText, getDailyAttempt, saveDailyAttempt } from "./daily";

// A tiny in-memory Storage, so the test doesn't need a browser.
function fakeStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (key) => data.get(key) ?? null,
    key: (index) => [...data.keys()][index] ?? null,
    removeItem: (key) => data.delete(key),
    setItem: (key, value) => data.set(key, value),
  };
}

describe("daily attempts", () => {
  it("remembers today's attempt and forgets it the next day", () => {
    const storage = fakeStorage();
    expect(getDailyAttempt("2026-11-20", storage)).toBeNull();
    saveDailyAttempt({ dateKey: "2026-11-20", finished: false, shareText: null, total: null }, storage);
    expect(getDailyAttempt("2026-11-20", storage)?.finished).toBe(false);
    expect(getDailyAttempt("2026-11-21", storage)).toBeNull();
  });

  it("ignores junk in storage", () => {
    const storage = fakeStorage();
    storage.setItem("budget-draft:daily", "{not json");
    expect(getDailyAttempt("2026-11-20", storage)).toBeNull();
  });
});

describe("buildShareText", () => {
  it("shows one square per slot, with bench and empty slots as white", () => {
    const game = createDailyGame("2026-11-20", bundledSeeds, "Sam");
    const text = buildShareText(game, "2026-11-20", 0);
    expect(text).toBe("Budget Draft #4 — 0 pts ⬜⬜⬜⬜⬜");
  });
});

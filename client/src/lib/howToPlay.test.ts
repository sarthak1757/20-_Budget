import { describe, expect, it } from "vitest";
import { hasSeenHowToPlay, HOW_TO_PLAY_CARDS, markHowToPlaySeen } from "./howToPlay";

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

describe("how to play", () => {
  it("has 4 short cards that use the real rule numbers", () => {
    expect(HOW_TO_PLAY_CARDS).toHaveLength(4);
    expect(HOW_TO_PLAY_CARDS[0]?.title).toBe("$20 for 5 slots");
    expect(HOW_TO_PLAY_CARDS[3]?.text).toContain("rated 10");
    for (const card of HOW_TO_PLAY_CARDS) {
      expect(card.text.length).toBeLessThan(160);
    }
  });

  it("is shown until the player has seen it once", () => {
    const storage = fakeStorage();
    expect(hasSeenHowToPlay(storage)).toBe(false);
    markHowToPlaySeen(storage);
    expect(hasSeenHowToPlay(storage)).toBe(true);
  });
});

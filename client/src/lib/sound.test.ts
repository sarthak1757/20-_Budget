import { describe, expect, it } from "vitest";
import type { PublicGameEvent, PublicItem } from "@budget-draft/shared";
import { SOUNDS, soundForEvents } from "./sound";

const item: PublicItem = { id: "a", name: "A", category: "t", price: 3, rating: 70, tag: "T" };

describe("soundForEvents", () => {
  it("picks buy over pass, pass on its own, and nothing for other events", () => {
    const passed: PublicGameEvent = { type: "passed", playerId: "p1", item, auto: false };
    const bought: PublicGameEvent = { type: "bought", playerId: "p2", item, price: 3 };
    expect(soundForEvents([passed, bought])).toBe("buy");
    expect(soundForEvents([passed])).toBe("pass");
    expect(soundForEvents([{ type: "peeked", playerId: "p1" }])).toBeNull();
    expect(soundForEvents([])).toBeNull();
  });
});

describe("SOUNDS", () => {
  it("keeps every note short and quiet enough", () => {
    for (const notes of Object.values(SOUNDS)) {
      expect(notes.length).toBeGreaterThan(0);
      for (const note of notes) {
        expect(note.volume).toBeLessThanOrEqual(0.3);
        expect(note.start + note.duration).toBeLessThan(1);
      }
    }
  });
});

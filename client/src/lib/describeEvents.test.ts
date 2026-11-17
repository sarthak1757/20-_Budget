import { describe, expect, it } from "vitest";
import type { Item, PlayerState } from "@budget-draft/shared";
import { describeEvent } from "./describeEvents";
import { getInitials } from "../components/Avatar";

const item: Item = { id: "x", name: "Hot Dog", category: "fast-food", price: 6, rating: 76, tag: "Classic" };
const players: PlayerState[] = [
  { id: "a", name: "Asha", isBot: false, isConnected: true, budget: 10, team: [] },
];

describe("describeEvent", () => {
  it("describes buys, passes, timeouts and discards", () => {
    expect(describeEvent({ type: "bought", playerId: "a", item }, players)).toBe("Asha bought Hot Dog for $6");
    expect(describeEvent({ type: "passed", playerId: "a", item, auto: false }, players)).toBe("Asha passed on Hot Dog");
    expect(describeEvent({ type: "passed", playerId: "a", item, auto: true }, players)).toBe(
      "Asha ran out of time and passed",
    );
    expect(describeEvent({ type: "discarded", item }, players)).toBe("Nobody bought Hot Dog, so it's gone");
  });
});

describe("getInitials", () => {
  it("uses first and last word", () => {
    expect(getInitials("Lionel Messi")).toBe("LM");
    expect(getInitials("Rodri")).toBe("R");
    expect(getInitials("Monkey D. Luffy")).toBe("ML");
  });
});

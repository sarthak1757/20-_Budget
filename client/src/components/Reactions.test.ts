import { describe, expect, it } from "vitest";
import { reactionLeftPercent } from "./Reactions";

describe("reactionLeftPercent", () => {
  it("keeps reactions on screen and spreads neighbours apart", () => {
    for (let id = 1; id <= 200; id++) {
      const left = reactionLeftPercent(id);
      expect(left).toBeGreaterThanOrEqual(10);
      expect(left).toBeLessThan(90);
      expect(Math.abs(left - reactionLeftPercent(id + 1))).toBeGreaterThan(5);
    }
  });
});

import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "@budget-draft/shared";
import { validateSetup } from "./validateSetup";

describe("validateSetup", () => {
  it("accepts good names and default settings", () => {
    expect(validateSetup(["Asha", "Ben"], DEFAULT_SETTINGS)).toEqual([]);
  });

  it("rejects blank and duplicate names (case-insensitive)", () => {
    const problems = validateSetup(["Asha", "  ", "asha"], DEFAULT_SETTINGS);
    expect(problems).toContain("Player 2 needs a name (1–20 characters)");
    expect(problems).toContain('"asha" is used twice');
  });

  it("rejects a budget below $1 per slot", () => {
    const problems = validateSetup(["A", "B"], { ...DEFAULT_SETTINGS, startingBudget: 5, slotCount: 6 });
    expect(problems).toContain("Starting budget must be at least $1 per slot");
  });
});

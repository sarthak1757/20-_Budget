import { describe, expect, it } from "vitest";
import { applyPreset, getRulesPreset } from "../presets";
import { makeSettings } from "./helpers";

describe("rules presets", () => {
  it("is classic with no extras", () => {
    expect(getRulesPreset(makeSettings())).toBe("classic");
  });

  it("is chaos with every extra on", () => {
    expect(getRulesPreset(makeSettings({ balancedTeam: true, mysteryItems: true, powerUps: true }))).toBe("chaos");
  });

  it("is custom with only some extras", () => {
    expect(getRulesPreset(makeSettings({ mysteryItems: true }))).toBe("custom");
  });

  it("counts as chaos without Balanced team when the category can't use it", () => {
    const settings = makeSettings({ mysteryItems: true, powerUps: true });
    expect(getRulesPreset(settings, false)).toBe("chaos");
    expect(getRulesPreset(settings, true)).toBe("custom");
  });

  it("applyPreset switches all extras and keeps everything else", () => {
    const chaos = applyPreset(makeSettings({ draftStyle: "auction" }), "chaos");
    expect(getRulesPreset(chaos)).toBe("chaos");
    expect(chaos.draftStyle).toBe("auction");
    expect(getRulesPreset(applyPreset(chaos, "classic"))).toBe("classic");
  });
});

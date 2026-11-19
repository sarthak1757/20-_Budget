import { describe, expect, it } from "vitest";
import { HAPTICS, vibrate } from "./haptics";

function fakeNavigator() {
  const calls: number[][] = [];
  return {
    calls,
    vibrate: (pattern: number[]) => {
      calls.push(pattern);
      return true;
    },
  };
}

describe("vibrate", () => {
  it("plays the named pattern", () => {
    const target = fakeNavigator();
    expect(vibrate("turn", false, target)).toBe(true);
    expect(target.calls).toEqual([HAPTICS.turn]);
  });

  it("stays still when the sound is muted", () => {
    const target = fakeNavigator();
    expect(vibrate("tap", true, target)).toBe(false);
    expect(target.calls).toEqual([]);
  });

  it("does nothing where vibration isn't supported, like iPhones", () => {
    expect(vibrate("win", false, {})).toBe(false);
  });

  it("swallows errors from the browser", () => {
    const target = {
      vibrate: () => {
        throw new Error("blocked until the user taps");
      },
    };
    expect(vibrate("tap", false, target)).toBe(false);
  });
});

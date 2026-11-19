// Short vibrations on phones that support them (Android; iPhones ignore
// navigator.vibrate). They follow the sound setting: muted means no buzz either.

export type HapticName = "tap" | "turn" | "win";

// Milliseconds: buzz, pause, buzz...
export const HAPTICS: Record<HapticName, number[]> = {
  tap: [12], // a tiny click for buy and bid
  turn: [40, 60, 40], // two pulses: "your turn"
  win: [30, 50, 30, 50, 90], // a little drumroll
};

interface VibrateTarget {
  vibrate?: (pattern: number[]) => boolean;
}

// Returns whether a vibration was started. `target` is navigator in the app;
// tests pass a fake.
export function vibrate(name: HapticName, muted: boolean, target: VibrateTarget = navigator): boolean {
  if (muted || typeof target.vibrate !== "function") {
    return false;
  }
  try {
    return target.vibrate(HAPTICS[name]);
  } catch {
    // Some browsers throw if the page hasn't been tapped yet. A missed buzz is fine.
    return false;
  }
}

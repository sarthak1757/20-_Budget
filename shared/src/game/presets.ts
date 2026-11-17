import type { GameSettings } from "../types/game";

// "classic" = no extras, "chaos" = every extra on, "custom" = anything in between.
// The draft style (classic/auction) is separate and stored on its own.
export type RulesPreset = "classic" | "custom" | "chaos";

export function getRulesPreset(settings: GameSettings): RulesPreset {
  let extrasOn = 0;
  if (settings.balancedTeam) extrasOn += 1;
  if (settings.mysteryItems) extrasOn += 1;
  if (settings.powerUps) extrasOn += 1;

  if (extrasOn === 0) {
    return "classic";
  }
  if (extrasOn === 3) {
    return "chaos";
  }
  return "custom";
}

// Returns a copy of the settings with every extra switched on or off.
export function applyPreset(settings: GameSettings, preset: "classic" | "chaos"): GameSettings {
  const on = preset === "chaos";
  return { ...settings, balancedTeam: on, mysteryItems: on, powerUps: on };
}

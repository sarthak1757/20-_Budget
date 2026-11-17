import type { GameMode } from "@budget-draft/shared";

// Turns the :mode URL segment into a GameMode, or null if it's not a real mode.
export function parseMode(value: string | undefined): GameMode | null {
  if (value === "local" || value === "online" || value === "bot") {
    return value;
  }
  return null;
}

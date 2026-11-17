import { gameSettingsSchema, playerNameSchema, type GameSettings } from "@budget-draft/shared";

// Checks the setup form before a local game starts.
// Returns a list of problems; an empty list means "good to go".
export function validateSetup(names: string[], settings: GameSettings): string[] {
  const problems: string[] = [];

  const seen = new Set<string>();
  for (let i = 0; i < names.length; i++) {
    const name = names[i] ?? "";
    const result = playerNameSchema.safeParse(name);
    if (!result.success) {
      problems.push(`Player ${i + 1} needs a name (1–20 characters)`);
      continue;
    }
    // Same name twice would make the board and results confusing.
    const key = result.data.toLowerCase();
    if (seen.has(key)) {
      problems.push(`"${result.data}" is used twice`);
    }
    seen.add(key);
  }

  const settingsResult = gameSettingsSchema.safeParse(settings);
  if (!settingsResult.success) {
    for (const issue of settingsResult.error.issues) {
      problems.push(issue.message);
    }
  }
  return problems;
}

import type { Item } from "../types/item";

// Balanced team: a category can list roles (football: Goalkeeper, Defender,
// Midfielder, Forward). An item's tag is its role. A team that has at least
// one item for every role gets a bonus at the end.

// The roles this team still needs, in the category's order. Bench items
// (tag "Bench") never count as a role.
export function findMissingRoles(team: readonly ({ tag: string; isBench?: boolean } | null)[], requiredRoles: readonly string[]): string[] {
  const missing: string[] = [];
  for (const role of requiredRoles) {
    let covered = false;
    for (const item of team) {
      if (item !== null && item.isBench !== true && item.tag === role) {
        covered = true;
      }
    }
    if (!covered) {
      missing.push(role);
    }
  }
  return missing;
}

export function coversAllRoles(team: readonly (Item | null)[], requiredRoles: readonly string[]): boolean {
  if (requiredRoles.length === 0) {
    return false; // no roles = no bonus to earn
  }
  return findMissingRoles(team, requiredRoles).length === 0;
}

// The roles a new game should require. Empty (no bonus) when the setting is
// off, the category has no roles, or there are fewer slots than roles,
// because then nobody could ever cover them all.
export function pickRequiredRoles(balancedTeam: boolean, categoryRoles: readonly string[], slotCount: number): string[] {
  if (!balancedTeam || categoryRoles.length === 0 || categoryRoles.length > slotCount) {
    return [];
  }
  return [...categoryRoles];
}

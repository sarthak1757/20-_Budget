import { describe, expect, it } from "vitest";
import type { Item } from "../../types/item";
import { createBenchItem } from "../bench";
import { BALANCED_TEAM_BONUS } from "../constants";
import { coversAllRoles, findMissingRoles, pickRequiredRoles } from "../roles";
import { computeResults, scoreTeam } from "../scoring";
import { makeItem, makePlayer, startGame } from "./helpers";

const ROLES = ["GK", "DEF", "MID", "FWD"];

function withTag(id: string, tag: string, rating = 50): Item {
  return { ...makeItem(id, 2, rating), tag };
}

describe("findMissingRoles", () => {
  it("lists roles the team doesn't have yet, in the category's order", () => {
    const team = [withTag("a", "MID"), null, withTag("b", "GK"), null];
    expect(findMissingRoles(team, ROLES)).toEqual(["DEF", "FWD"]);
  });

  it("never counts a bench item as a role", () => {
    const bench = { ...createBenchItem("test", "p1", 0), tag: "GK" };
    expect(findMissingRoles([bench], ["GK"])).toEqual(["GK"]);
  });
});

describe("coversAllRoles", () => {
  it("is true only when every role is covered", () => {
    const full = [withTag("a", "GK"), withTag("b", "DEF"), withTag("c", "MID"), withTag("d", "FWD"), withTag("e", "FWD")];
    expect(coversAllRoles(full, ROLES)).toBe(true);
    expect(coversAllRoles(full.slice(0, 3), ROLES)).toBe(false);
  });

  it("is false when there are no roles to cover", () => {
    expect(coversAllRoles([withTag("a", "GK")], [])).toBe(false);
  });
});

describe("pickRequiredRoles", () => {
  it("is empty when the setting is off or the category has no roles", () => {
    expect(pickRequiredRoles(false, ROLES, 5)).toEqual([]);
    expect(pickRequiredRoles(true, [], 5)).toEqual([]);
  });

  it("is empty with fewer slots than roles, since nobody could cover them", () => {
    expect(pickRequiredRoles(true, ROLES, 3)).toEqual([]);
    expect(pickRequiredRoles(true, ROLES, 4)).toEqual(ROLES);
  });
});

describe("balanced team bonus", () => {
  it("adds the bonus to a team that covers every role", () => {
    const team = [withTag("a", "GK", 60), withTag("b", "DEF", 60), withTag("c", "MID", 60), withTag("d", "FWD", 60)];
    const player = makePlayer({ budget: 2, team });
    expect(scoreTeam(player, ROLES)).toEqual({
      ratingTotal: 240,
      leftoverBonus: 2,
      roleBonus: BALANCED_TEAM_BONUS,
      total: 240 + 2 + BALANCED_TEAM_BONUS,
    });
    expect(scoreTeam(player).roleBonus).toBe(0); // no roles in play
  });

  it("is applied by computeResults using the game's required roles", () => {
    const items = [withTag("a", "GK"), withTag("b", "DEF"), withTag("c", "MID"), withTag("d", "FWD")];
    const game = startGame({ items, settings: { balancedTeam: true, slotCount: 4 } });
    const withRoles = { ...game, requiredRoles: ROLES, phase: "finished" as const };
    withRoles.players = withRoles.players.map((p) => (p.id === "p1" ? { ...p, team: items } : p));
    const results = computeResults(withRoles);
    expect(results.scores.find((s) => s.playerId === "p1")?.roleBonus).toBe(BALANCED_TEAM_BONUS);
    expect(results.scores.find((s) => s.playerId === "p2")?.roleBonus).toBe(0);
  });

  it("createGame only requires roles when the setting is on", () => {
    const createdWith = (balancedTeam: boolean) =>
      startGame({ settings: { balancedTeam, slotCount: 4 }, roles: ROLES }).requiredRoles;
    expect(createdWith(false)).toEqual([]);
    expect(createdWith(true)).toEqual(ROLES);
  });

  it("createGame switches the setting off when it can't apply", () => {
    const game = startGame({ settings: { balancedTeam: true, slotCount: 3 }, roles: ROLES });
    expect(game.requiredRoles).toEqual([]);
    expect(game.settings.balancedTeam).toBe(false);
  });
});

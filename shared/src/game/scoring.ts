import type { FinalScore, GameResults, GameState, PlayerState } from "../types/game";
import { BALANCED_TEAM_BONUS, LEFTOVER_POINTS_PER_DOLLAR, MIN_HUMANS_FOR_VOTE } from "./constants";
import { coversAllRoles } from "./roles";

export interface TeamScore {
  ratingTotal: number;
  leftoverBonus: number;
  roleBonus: number;
  total: number;
}

// requiredRoles is empty unless the game uses Balanced team.
export function scoreTeam(player: PlayerState, requiredRoles: readonly string[] = []): TeamScore {
  let ratingTotal = 0;
  for (const item of player.team) {
    if (item !== null) {
      ratingTotal += item.rating;
    }
  }
  // A small reward for spending wisely. Small on purpose: ratings should
  // matter far more than hoarding cash.
  const leftoverBonus = player.budget * LEFTOVER_POINTS_PER_DOLLAR;
  const roleBonus = coversAllRoles(player.team, requiredRoles) ? BALANCED_TEAM_BONUS : 0;
  return { ratingTotal, leftoverBonus, roleBonus, total: ratingTotal + leftoverBonus + roleBonus };
}

export function countHumans(players: PlayerState[]): number {
  let humans = 0;
  for (const player of players) {
    if (!player.isBot) {
      humans += 1;
    }
  }
  return humans;
}

export function shouldHoldVote(players: PlayerState[]): boolean {
  return countHumans(players) >= MIN_HUMANS_FOR_VOTE;
}

export function tallyVotes(votes: Record<string, string>): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const votedForId of Object.values(votes)) {
    counts[votedForId] = (counts[votedForId] ?? 0) + 1;
  }
  return counts;
}

// Returns every id that has the highest value. More than one id = a tie,
// and tied players share the win.
function idsWithHighest(values: { id: string; value: number }[]): string[] {
  let best = -Infinity;
  for (const entry of values) {
    if (entry.value > best) {
      best = entry.value;
    }
  }
  const winners: string[] = [];
  for (const entry of values) {
    if (entry.value === best) {
      winners.push(entry.id);
    }
  }
  return winners;
}

export function computeResults(state: GameState): GameResults {
  const voteCounts = tallyVotes(state.votes);
  const scores: FinalScore[] = [];

  for (const player of state.players) {
    const teamScore = scoreTeam(player, state.requiredRoles);
    scores.push({
      playerId: player.id,
      name: player.name,
      ratingTotal: teamScore.ratingTotal,
      leftoverBonus: teamScore.leftoverBonus,
      roleBonus: teamScore.roleBonus,
      total: teamScore.total,
      votesReceived: voteCounts[player.id] ?? 0,
    });
  }

  scores.sort((a, b) => b.total - a.total);

  const totals = scores.map((score) => ({ id: score.playerId, value: score.total }));
  const statsWinnerIds = idsWithHighest(totals);

  const votingHeld = shouldHoldVote(state.players);
  let voteWinnerIds: string[] = [];
  const anyVotes = Object.keys(state.votes).length > 0;
  if (votingHeld && anyVotes) {
    const voteTotals = scores.map((score) => ({ id: score.playerId, value: score.votesReceived }));
    voteWinnerIds = idsWithHighest(voteTotals);
  }

  return { scores, statsWinnerIds, voteWinnerIds, votingHeld };
}

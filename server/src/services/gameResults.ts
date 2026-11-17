import type { GameResults, GameState, LeaderboardEntry } from "@budget-draft/shared";
import { GameResultModel, type PlayerResult, type TeamItemSnapshot } from "../models/GameResult";

// Turns a finished game into a GameResult document and saves it.
export async function saveGameResult(state: GameState, results: GameResults, roomCode?: string): Promise<void> {
  const players: PlayerResult[] = [];
  for (const player of state.players) {
    const team: TeamItemSnapshot[] = [];
    for (const item of player.team) {
      if (item !== null) {
        team.push({
          name: item.name,
          price: item.price,
          rating: item.rating,
          tag: item.tag,
          isBench: item.isBench === true,
        });
      }
    }
    const score = results.scores.find((entry) => entry.playerId === player.id);
    players.push({
      playerId: player.id,
      name: player.name,
      isBot: player.isBot,
      budgetLeft: player.budget,
      team,
      ratingTotal: score?.ratingTotal ?? 0,
      leftoverBonus: score?.leftoverBonus ?? 0,
      total: score?.total ?? 0,
      votesReceived: score?.votesReceived ?? 0,
    });
  }

  await GameResultModel.create({
    mode: state.mode,
    categorySlug: state.settings.categorySlug,
    roomCode,
    settings: { startingBudget: state.settings.startingBudget, slotCount: state.settings.slotCount },
    players,
    statsWinnerIds: results.statsWinnerIds,
    voteWinnerIds: results.voteWinnerIds,
    votingHeld: results.votingHeld,
    // Only online games are ranked: in local/bot games one person controls every name.
    countsForLeaderboard: state.mode === "online",
    playedAt: new Date(),
  });
}

// Wins = times a player was the stats winner (a shared win in a tie still counts).
// Players are grouped by name, case-insensitive, since there are no accounts.
export async function getLeaderboard(limit = 50): Promise<LeaderboardEntry[]> {
  return GameResultModel.aggregate<LeaderboardEntry>([
    { $match: { countsForLeaderboard: true } },
    { $unwind: "$players" },
    { $match: { "players.isBot": false } },
    {
      $group: {
        _id: { $toLower: "$players.name" },
        name: { $first: "$players.name" },
        gamesPlayed: { $sum: 1 },
        wins: { $sum: { $cond: [{ $in: ["$players.playerId", "$statsWinnerIds"] }, 1, 0] } },
        bestScore: { $max: "$players.total" },
      },
    },
    { $sort: { wins: -1, bestScore: -1, gamesPlayed: 1, name: 1 } },
    { $limit: limit },
    { $project: { _id: 0, name: 1, wins: 1, gamesPlayed: 1, bestScore: 1 } },
  ]);
}

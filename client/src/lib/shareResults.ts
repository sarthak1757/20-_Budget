import type { GameResults, PublicPlayerState } from "@budget-draft/shared";

// One line to paste anywhere, e.g.
// "Budget Draft: Asha won with 415 pts · Ben 397 · Chen 380"
// Scores come from the finished results, best first. Ties share the win.
export function buildResultsShareText(players: PublicPlayerState[], results: GameResults): string {
  const nameOf = new Map<string, string>();
  for (const player of players) {
    nameOf.set(player.id, player.name);
  }
  const winners: string[] = [];
  for (const id of results.statsWinnerIds) {
    winners.push(nameOf.get(id) ?? "Someone");
  }
  const best = results.scores[0]?.total ?? 0;

  const others: string[] = [];
  for (const score of results.scores) {
    if (!results.statsWinnerIds.includes(score.playerId)) {
      others.push(`${nameOf.get(score.playerId) ?? "Someone"} ${score.total}`);
    }
  }
  const verb = winners.length > 1 ? "tied" : "won";
  let text = `Budget Draft: ${winners.join(" & ")} ${verb} with ${best} pts`;
  if (others.length > 0) {
    text += ` · ${others.join(" · ")}`;
  }
  return text;
}

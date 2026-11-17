import type { GameResults, PlayerState } from "@budget-draft/shared";
import { Avatar } from "./Avatar";

interface ResultsViewProps {
  players: PlayerState[];
  results: GameResults;
}

function namesFor(ids: string[], players: PlayerState[]): string {
  const names: string[] = [];
  for (const id of ids) {
    for (const player of players) {
      if (player.id === id) {
        names.push(player.name);
      }
    }
  }
  return names.join(" & ");
}

export function ResultsView({ players, results }: ResultsViewProps) {
  const statsTie = results.statsWinnerIds.length > 1;
  const voteTie = results.voteWinnerIds.length > 1;

  return (
    <div className="grid gap-6">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-emerald-700 bg-emerald-950/40 p-5">
          <p className="text-sm text-emerald-300 uppercase">📊 Stats winner{statsTie && " (tie)"}</p>
          <p className="mt-1 text-3xl font-black">{namesFor(results.statsWinnerIds, players)}</p>
        </div>
        {results.votingHeld && (
          <div className="rounded-2xl border border-violet-700 bg-violet-950/40 p-5">
            <p className="text-sm text-violet-300 uppercase">🗳️ Vote winner{voteTie && " (tie)"}</p>
            <p className="mt-1 text-3xl font-black">
              {results.voteWinnerIds.length > 0 ? namesFor(results.voteWinnerIds, players) : "No votes cast"}
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {results.scores.map((score, rank) => {
          const player = players.find((p) => p.id === score.playerId);
          if (!player) {
            return null;
          }
          const isWinner = results.statsWinnerIds.includes(score.playerId);
          return (
            <section
              key={score.playerId}
              className={`rounded-2xl border-2 bg-zinc-900 p-4 ${isWinner ? "border-emerald-400" : "border-zinc-800"}`}
            >
              <header className="flex items-baseline justify-between">
                <h2 className="text-lg font-bold">
                  {rank + 1}. {player.isBot && "🤖 "}
                  {player.name}
                </h2>
                <span className="text-2xl font-black tabular-nums">{score.total}</span>
              </header>
              <p className="mb-3 text-sm text-zinc-400">
                {score.ratingTotal} rating + {score.leftoverBonus} leftover bonus
                {results.votingHeld && ` · ${score.votesReceived} vote${score.votesReceived === 1 ? "" : "s"}`}
              </p>
              <ol className="grid gap-1.5">
                {player.team.map((item, index) =>
                  item ? (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <Avatar name={item.name} emoji={item.emoji} size="sm" />
                      <span className={`min-w-0 flex-1 truncate ${item.isBench ? "text-zinc-500" : ""}`}>{item.name}</span>
                      <span className="text-zinc-500 tabular-nums">${item.price}</span>
                      <span className="w-7 text-right font-semibold tabular-nums">{item.rating}</span>
                    </li>
                  ) : null,
                )}
              </ol>
              <p className="text-money mt-3 text-sm">${player.budget} left</p>
            </section>
          );
        })}
      </div>
    </div>
  );
}

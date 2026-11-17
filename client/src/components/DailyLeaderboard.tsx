import type { DailyLeaderboard as DailyLeaderboardData } from "@budget-draft/shared";
import { apiRequest } from "../lib/api";
import { useAsync } from "../lib/useAsync";
import { Card, ErrorBox, Spinner } from "./ui";

// Today's top scores. `refreshKey` changes after a submit, to load it again.
export function DailyLeaderboard({ dateKey, refreshKey = 0 }: { dateKey: string; refreshKey?: number }) {
  const board = useAsync(
    () => apiRequest<DailyLeaderboardData>(`/api/daily/leaderboard?date=${dateKey}`),
    [dateKey, refreshKey],
  );

  if (board.status === "loading") {
    return <Spinner label="Loading today's scores…" />;
  }
  if (board.status === "error") {
    return <ErrorBox message={board.message} onRetry={board.retry} />;
  }
  const entries = board.data.entries;
  return (
    <Card>
      <h2 className="mb-3 text-lg font-bold">Today's best · #{board.data.number}</h2>
      {entries.length === 0 && <p className="text-zinc-400">No scores yet. Be the first!</p>}
      <ol className="grid gap-1">
        {entries.map((entry, index) => (
          <li key={entry.name} className="flex items-center gap-3 rounded-lg px-2 py-1 odd:bg-zinc-800/50">
            <span className="w-6 text-right text-zinc-500">{index + 1}</span>
            <span className="flex-1 truncate font-semibold">{entry.name}</span>
            {entry.beatBot && (
              <span className="text-xs text-emerald-400" title="Beat the Daily Bot">
                beat bot
              </span>
            )}
            <span className="font-mono">{entry.total}</span>
          </li>
        ))}
      </ol>
    </Card>
  );
}

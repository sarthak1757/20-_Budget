import type { DailyLeaderboard as DailyLeaderboardData } from "@budget-draft/shared";
import { apiRequest } from "../lib/api";
import { useAsync } from "../lib/useAsync";
import { Label } from "./brand/primitives";
import { Card, CardTitle, ErrorBox, Spinner } from "./ui";

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
    <Card className="grid gap-4">
      <CardTitle>Today's best · #{board.data.number}</CardTitle>
      {entries.length === 0 && <p className="text-platinum">No scores yet. Be the first!</p>}
      <ol>
        {entries.map((entry, index) => (
          <li key={entry.name} className="flex items-center gap-3 border-t border-platinum/30 py-3 last:border-b">
            <Label className={`w-6 ${index === 0 ? "text-lavender" : "text-platinum/80"}`}>{String(index + 1).padStart(2, "0")}</Label>
            <span className="display-italic min-w-0 flex-1 truncate text-2xl text-lavender">{entry.name}</span>
            {entry.beatBot && <Label className="text-lavender-deep">Beat bot</Label>}
            <span className="display-italic text-3xl text-lavender tabular-nums">{entry.total}</span>
          </li>
        ))}
      </ol>
    </Card>
  );
}

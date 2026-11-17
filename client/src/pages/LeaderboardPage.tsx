import { Link } from "react-router";
import type { LeaderboardEntry } from "@budget-draft/shared";
import { Avatar } from "../components/Avatar";
import { ErrorBox, PageShell, Spinner } from "../components/ui";
import { apiRequest } from "../lib/api";
import { useAsync } from "../lib/useAsync";

function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  return apiRequest<LeaderboardEntry[]>("/api/leaderboard");
}

const MEDALS = ["🥇", "🥈", "🥉"];

export function LeaderboardPage() {
  const leaderboard = useAsync(fetchLeaderboard, []);

  return (
    <PageShell title="Leaderboard" backTo="/">
      <p className="mb-4 text-sm text-zinc-400">
        Online games only. A win means the best stats score in that game (ties share the win).
      </p>
      {leaderboard.status === "loading" && <Spinner label="Loading leaderboard…" />}
      {leaderboard.status === "error" && <ErrorBox message={leaderboard.message} onRetry={leaderboard.retry} />}
      {leaderboard.status === "ready" && leaderboard.data.length === 0 && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-center">
          <p className="text-4xl" aria-hidden>
            🏆
          </p>
          <p className="mt-2 text-zinc-300">No online games yet.</p>
          <Link to="/new/online" className="mt-3 inline-block text-emerald-400 underline">
            Start an online room
          </Link>
        </div>
      )}
      {leaderboard.status === "ready" && leaderboard.data.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-zinc-800">
          <table className="w-full text-left">
            <thead className="bg-zinc-900 text-sm text-zinc-400">
              <tr>
                <th className="px-3 py-3 font-medium">#</th>
                <th className="px-3 py-3 font-medium">Player</th>
                <th className="px-3 py-3 text-right font-medium">Wins</th>
                <th className="px-3 py-3 text-right font-medium">Games</th>
                <th className="px-3 py-3 text-right font-medium">Best</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.data.map((entry, index) => (
                <tr key={entry.name} className="border-t border-zinc-800">
                  <td className="px-3 py-3 tabular-nums">{MEDALS[index] ?? index + 1}</td>
                  <td className="px-3 py-3">
                    <span className="flex items-center gap-2">
                      <Avatar name={entry.name} size="sm" />
                      <span className="font-semibold">{entry.name}</span>
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right font-bold tabular-nums">{entry.wins}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{entry.gamesPlayed}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{entry.bestScore}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageShell>
  );
}

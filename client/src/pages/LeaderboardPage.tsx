import type { LeaderboardEntry } from "@budget-draft/shared";
import { Avatar } from "../components/Avatar";
import { ArrowLink, Label } from "../components/brand/primitives";
import { ErrorBox, PageShell, Spinner } from "../components/ui";
import { apiRequest } from "../lib/api";
import { useAsync } from "../lib/useAsync";

function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  return apiRequest<LeaderboardEntry[]>("/api/leaderboard");
}

export function LeaderboardPage() {
  const leaderboard = useAsync(fetchLeaderboard, []);

  return (
    <PageShell title="Leaderboard" backTo="/">
      <p className="mb-8 max-w-2xl text-platinum">
        Online games only. A win means the best stats score in that game (ties share the win). Best is the top score in
        a Classic game with no extras, so scores are compared fairly.
      </p>
      {leaderboard.status === "loading" && <Spinner label="Loading leaderboard…" />}
      {leaderboard.status === "error" && <ErrorBox message={leaderboard.message} onRetry={leaderboard.retry} />}
      {leaderboard.status === "ready" && leaderboard.data.length === 0 && (
        <div className="grid justify-items-start gap-5 border-y border-platinum/30 py-10">
          <p className="display-italic text-5xl text-lavender">No online games yet.</p>
          <ArrowLink to="/new/online">Start an online room</ArrowLink>
        </div>
      )}
      {leaderboard.status === "ready" && leaderboard.data.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[22rem] text-left">
            <thead>
              <tr className="border-b border-platinum/30">
                <th className="py-3 pr-3 font-normal"><Label>#</Label></th>
                <th className="px-3 py-3 font-normal"><Label>Player</Label></th>
                <th className="px-3 py-3 text-right font-normal"><Label>Wins</Label></th>
                <th className="px-3 py-3 text-right font-normal"><Label>Games</Label></th>
                <th className="py-3 pl-3 text-right font-normal"><Label>Best</Label></th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.data.map((entry, index) => (
                <tr key={entry.name} className="border-b border-platinum/30">
                  <td className="py-4 pr-3">
                    <Label className={index === 0 ? "text-lavender" : "text-platinum/80"}>{String(index + 1).padStart(2, "0")}</Label>
                  </td>
                  <td className="px-3 py-4">
                    <span className="flex items-center gap-3">
                      <Avatar name={entry.name} size="sm" />
                      <span className="display-italic text-2xl text-lavender sm:text-3xl">{entry.name}</span>
                    </span>
                  </td>
                  <td className="display-italic px-3 py-4 text-right text-3xl text-lavender tabular-nums">{entry.wins}</td>
                  <td className="px-3 py-4 text-right text-platinum tabular-nums">{entry.gamesPlayed}</td>
                  <td className="py-4 pl-3 text-right text-platinum tabular-nums">{entry.bestScore ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageShell>
  );
}

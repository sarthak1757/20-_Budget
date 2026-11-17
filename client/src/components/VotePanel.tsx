import { scoreTeam, type PlayerState } from "@budget-draft/shared";
import type { ReactNode } from "react";
import { Avatar } from "./Avatar";

interface VotePanelProps {
  voterId: string;
  voterName: string;
  players: PlayerState[];
  selectedId?: string | undefined; // online: the vote already cast (can be changed)
  disabled?: boolean;
  timer?: ReactNode;
  onVote: (targetId: string) => void;
}

// Everyone votes for the best team that isn't their own.
export function VotePanel({ voterId, voterName, players, selectedId, disabled = false, timer, onVote }: VotePanelProps) {
  const candidates: PlayerState[] = [];
  for (const player of players) {
    if (player.id !== voterId) {
      candidates.push(player);
    }
  }

  return (
    <div className="mx-auto grid max-w-4xl gap-4">
      <div className="text-center">
        <h1 className="text-3xl font-black">Vote for the best team</h1>
        <p className="mt-1 text-zinc-400">{voterName}, pick the team you like most. You can't vote for yourself.</p>
      </div>
      {timer}
      <div className="grid gap-3 sm:grid-cols-3">
        {candidates.map((player) => {
          const isSelected = selectedId === player.id;
          return (
            <button
              key={player.id}
              type="button"
              disabled={disabled}
              onClick={() => onVote(player.id)}
              aria-pressed={isSelected}
              className={`rounded-2xl border-2 bg-zinc-900 p-4 text-left transition hover:border-emerald-500 disabled:opacity-60 ${isSelected ? "border-emerald-400" : "border-zinc-800"}`}
            >
              <p className="text-lg font-bold">{player.name}</p>
              <p className="mb-2 text-sm text-zinc-500">Rating total {scoreTeam(player).ratingTotal}</p>
              <ul className="grid gap-1">
                {player.team.map((item, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm">
                    {item ? (
                      <>
                        <Avatar name={item.name} emoji={item.emoji} size="sm" />
                        <span className="truncate">{item.name}</span>
                        <span className="ml-auto text-zinc-500 tabular-nums">{item.rating}</span>
                      </>
                    ) : (
                      <span className="text-zinc-600">Empty</span>
                    )}
                  </li>
                ))}
              </ul>
              {isSelected && <p className="mt-2 text-sm font-semibold text-emerald-400">Your vote</p>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

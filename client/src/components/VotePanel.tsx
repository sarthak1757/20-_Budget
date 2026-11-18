import type { PublicItem, PublicPlayerState } from "@budget-draft/shared";
import type { ReactNode } from "react";
import { Hairline, Label } from "./brand/primitives";

interface VotePanelProps {
  voterId: string;
  voterName: string;
  players: PublicPlayerState[];
  selectedId?: string | undefined; // online: the vote already cast (can be changed)
  disabled?: boolean;
  timer?: ReactNode;
  onVote: (targetId: string) => void;
}

// Mystery ratings are revealed when the draft ends, so by voting time
// every rating is known; a null (never expected here) counts as 0.
function ratingTotal(team: (PublicItem | null)[]): number {
  let total = 0;
  for (const item of team) {
    if (item !== null && item.rating !== null) {
      total += item.rating;
    }
  }
  return total;
}

// Everyone votes for the best team that isn't their own.
export function VotePanel({ voterId, voterName, players, selectedId, disabled = false, timer, onVote }: VotePanelProps) {
  const candidates: PublicPlayerState[] = [];
  for (const player of players) {
    if (player.id !== voterId) {
      candidates.push(player);
    }
  }

  return (
    <div className="grid gap-8">
      <div className="grid gap-3">
        <Label>Vote · {voterName}</Label>
        <h1 className="display-italic text-5xl text-lavender sm:text-7xl">Vote for the best team</h1>
        <p className="text-platinum">Pick the team you like most. You can't vote for yourself.</p>
      </div>
      {timer}
      <div className="grid gap-4 sm:grid-cols-3">
        {candidates.map((player) => {
          const isSelected = selectedId === player.id;
          return (
            <button
              key={player.id}
              type="button"
              disabled={disabled}
              onClick={() => onVote(player.id)}
              aria-pressed={isSelected}
              className={`grid grid-cols-[minmax(0,1fr)] content-start gap-3 rounded-[1.75rem] bg-mocha-dark p-5 text-left transition hover:bg-mocha-light/40 disabled:opacity-60 ${isSelected ? "shadow-glow" : "ring-1 ring-platinum/30"}`}
            >
              <span className="display-italic text-4xl text-lavender">{player.name}</span>
              <Label>Rating total {ratingTotal(player.team)}</Label>
              <Hairline />
              <ul className="grid grid-cols-[minmax(0,1fr)]">
                {player.team.map((item, index) => (
                  <li key={index} className="flex items-center gap-2 border-b border-platinum/30 py-2 last:border-b-0">
                    {item ? (
                      <>
                        <span className="display-italic min-w-0 flex-1 truncate text-lg text-lavender">{item.name}</span>
                        <span className="display-italic text-xl text-platinum tabular-nums">{item.rating}</span>
                      </>
                    ) : (
                      <Label className="text-platinum/70">Empty</Label>
                    )}
                  </li>
                ))}
              </ul>
              {isSelected && <Label className="text-lavender-deep">Your vote</Label>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

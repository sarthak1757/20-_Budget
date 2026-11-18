import { Share2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { DailyResultResponse, GameState, TurnMove } from "@budget-draft/shared";
import { buildShareText, copyToClipboard, saveDailyAttempt, submitDaily } from "../lib/daily";
import { showToast } from "../store/toastStore";
import { ICON_STROKE, Label, PillButton, PillLink, UrgentNote } from "./brand/primitives";
import { Card } from "./ui";

interface DailyResultPanelProps {
  game: GameState;
  daily: { dateKey: string; moves: TurnMove[] };
  total: number;
  alreadySubmitted: boolean;
  onSubmitted: () => void;
}

type SubmitState =
  | { status: "idle" }
  | { status: "sending" }
  | { status: "done"; response: DailyResultResponse }
  | { status: "error"; message: string };

// Shown under the results of a Daily Challenge: sends the moves to the
// server (once), then shows the rank and a share button.
export function DailyResultPanel({ game, daily, total, alreadySubmitted, onSubmitted }: DailyResultPanelProps) {
  const shareText = buildShareText(game, daily.dateKey, total);
  const [submit, setSubmit] = useState<SubmitState>({ status: "idle" });
  const started = useRef(false);

  useEffect(() => {
    if (alreadySubmitted || started.current) {
      return;
    }
    started.current = true;
    onSubmitted();
    saveDailyAttempt({ dateKey: daily.dateKey, finished: true, shareText, total });
    const human = game.players.find((player) => !player.isBot);
    setSubmit({ status: "sending" });
    submitDaily(daily.dateKey, human?.name ?? "Player", daily.moves)
      .then((response) => setSubmit({ status: "done", response }))
      .catch((error: unknown) => {
        setSubmit({ status: "error", message: error instanceof Error ? error.message : "Couldn't save the score" });
      });
  }, [alreadySubmitted, daily, game, onSubmitted, shareText, total]);

  async function share() {
    const copied = await copyToClipboard(shareText);
    showToast(copied ? "Copied! Paste it anywhere." : "Couldn't copy. Select the text instead.", copied ? "success" : "warning");
  }

  return (
    <Card className="mt-10 grid max-w-xl gap-4">
      <Label>Your daily result</Label>
      <p className="display-italic text-4xl text-lavender">{shareText}</p>
      {submit.status === "sending" && <Label>Saving your score…</Label>}
      {submit.status === "done" && (
        <p className="text-platinum">
          You're <span className="display-italic text-3xl text-lavender">#{submit.response.rank}</span> of {submit.response.players} today.
        </p>
      )}
      {submit.status === "error" && (
        <p role="alert">
          <UrgentNote>Score not saved: {submit.message}</UrgentNote>
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <PillButton onClick={() => void share()}>
          <Share2 size={16} strokeWidth={ICON_STROKE} aria-hidden />
          Copy result
        </PillButton>
        <PillLink to="/daily">Today's leaderboard</PillLink>
      </div>
    </Card>
  );
}

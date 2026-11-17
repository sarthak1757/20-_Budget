import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import type { DailyResultResponse, GameState, TurnMove } from "@budget-draft/shared";
import { buildShareText, copyToClipboard, saveDailyAttempt, submitDaily } from "../lib/daily";
import { showToast } from "../store/toastStore";
import { Button, Card } from "./ui";

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
    <Card className="mt-6">
      <p className="rounded-xl bg-zinc-950 p-3 text-center font-mono text-lg">{shareText}</p>
      {submit.status === "sending" && <p className="mt-3 text-center text-zinc-400">Saving your score…</p>}
      {submit.status === "done" && (
        <p className="mt-3 text-center">
          You're <span className="font-bold text-money">#{submit.response.rank}</span> of {submit.response.players} today.
        </p>
      )}
      {submit.status === "error" && <p className="mt-3 text-center text-rose-400">Score not saved: {submit.message}</p>}
      <div className="mt-4 flex flex-wrap justify-center gap-3">
        <Button onClick={() => void share()}>📋 Copy result</Button>
        <Link to="/daily" className="rounded-xl bg-zinc-800 px-4 py-3 font-semibold hover:bg-zinc-700">
          Today's leaderboard
        </Link>
      </div>
    </Card>
  );
}

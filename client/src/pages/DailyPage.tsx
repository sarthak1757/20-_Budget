import { useState } from "react";
import { useNavigate } from "react-router";
import { createDailyGame, dailyNumber, pickDailyCategory, toDateKey } from "@budget-draft/shared";
import { DailyLeaderboard } from "../components/DailyLeaderboard";
import { NameField } from "../components/NameField";
import { Button, Card, PageShell } from "../components/ui";
import { bundledSeeds } from "../data/bundledCategories";
import { copyToClipboard, getDailyAttempt, saveDailyAttempt } from "../lib/daily";
import { getStoredName, storeName } from "../lib/playerStorage";
import { showToast } from "../store/toastStore";
import { useLocalGameStore } from "../store/localGameStore";

export function DailyPage() {
  const navigate = useNavigate();
  const startDaily = useLocalGameStore((store) => store.startDaily);
  const [name, setName] = useState(getStoredName);
  // Read once: the date doesn't change while the page is open (close enough).
  const [dateKey] = useState(() => toDateKey(new Date()));
  const category = pickDailyCategory(dateKey, bundledSeeds);
  const attempt = getDailyAttempt(dateKey);

  function start() {
    const playerName = name.trim();
    if (playerName === "") {
      return;
    }
    storeName(playerName);
    // Marked at the start, so quitting a bad game doesn't give a second try.
    saveDailyAttempt({ dateKey, finished: false, shareText: null, total: null });
    startDaily(createDailyGame(dateKey, bundledSeeds, playerName), dateKey);
    navigate("/play");
  }

  async function share(text: string) {
    const copied = await copyToClipboard(text);
    showToast(copied ? "Copied! Paste it anywhere." : "Couldn't copy. Select the text instead.", copied ? "success" : "warning");
  }

  return (
    <PageShell title={`Daily Challenge #${dailyNumber(dateKey)}`} backTo="/">
      <div className="grid gap-4">
        <Card>
          <p className="text-zinc-300">
            Today's category: <span className="font-bold">{category.emoji} {category.name}</span>
          </p>
          <p className="mt-2 text-sm text-zinc-400">
            Everyone gets the same items in the same order against the same hard bot. $20, 5 slots, mystery items
            on. One try per day, so make it count.
          </p>

          {attempt === null && (
            <div className="mt-4 grid gap-3">
              <NameField value={name} onChange={setName} />
              <Button onClick={start} disabled={name.trim() === ""}>
                Play today's daily
              </Button>
            </div>
          )}

          {attempt !== null && !attempt.finished && (
            <p className="mt-4 text-amber-300">You already started today's daily. Come back tomorrow!</p>
          )}

          {attempt !== null && attempt.finished && attempt.shareText !== null && (
            <div className="mt-4 grid gap-3">
              <p className="rounded-xl bg-zinc-950 p-3 font-mono text-lg">{attempt.shareText}</p>
              <Button onClick={() => void share(attempt.shareText ?? "")}>📋 Copy result</Button>
              <p className="text-sm text-zinc-400">Next daily at midnight UTC.</p>
            </div>
          )}
        </Card>

        <DailyLeaderboard dateKey={dateKey} />
      </div>
    </PageShell>
  );
}

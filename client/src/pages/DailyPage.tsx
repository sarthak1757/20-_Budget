import { Share2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { createDailyGame, dailyNumber, pickDailyCategory, toDateKey } from "@budget-draft/shared";
import { ICON_STROKE, Label, PillButton } from "../components/brand/primitives";
import { DailyLeaderboard } from "../components/DailyLeaderboard";
import { NameField } from "../components/NameField";
import { Card, PageShell } from "../components/ui";
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
      <div className="grid max-w-xl gap-6">
        <Card className="grid gap-5">
          <div className="grid gap-1">
            <Label>Today's category</Label>
            <p className="display-serif text-4xl text-ivory sm:text-5xl">
              {category.emoji} {category.name}
            </p>
          </div>
          <p className="text-mist">
            Everyone gets the same items in the same order against the same hard bot. $20, 5 slots, mystery items on.
            One try per day, so make it count.
          </p>

          {attempt === null && (
            <div className="grid gap-5">
              <NameField value={name} onChange={setName} />
              <PillButton onClick={start} disabled={name.trim() === ""}>
                Play today's daily
              </PillButton>
            </div>
          )}

          {attempt !== null && !attempt.finished && (
            <p className="text-ivory">You already started today's daily. Come back tomorrow!</p>
          )}

          {attempt !== null && attempt.finished && attempt.shareText !== null && (
            <div className="grid gap-4">
              <p className="display-serif text-3xl text-ivory">{attempt.shareText}</p>
              <PillButton onClick={() => void share(attempt.shareText ?? "")}>
                <Share2 size={16} strokeWidth={ICON_STROKE} aria-hidden />
                Copy result
              </PillButton>
              <Label>Next daily at midnight UTC</Label>
            </div>
          )}
        </Card>

        <DailyLeaderboard dateKey={dateKey} />
      </div>
    </PageShell>
  );
}

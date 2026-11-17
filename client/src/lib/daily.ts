import {
  dailyShareText,
  toPublicItem,
  type DailyResultPayload,
  type DailyResultResponse,
  type GameState,
  type TurnMove,
} from "@budget-draft/shared";
import { apiRequest } from "./api";

// One attempt per day per device, remembered in localStorage. This is a
// friendly limit, not security: clearing storage gets another go. The server's
// one-score-per-name rule is what keeps the daily leaderboard fair.

const ATTEMPT_KEY = "budget-draft:daily";

export interface DailyAttempt {
  dateKey: string;
  finished: boolean;
  shareText: string | null; // set once the game is finished
  total: number | null;
}

// `storage` is a parameter so tests can pass a fake one.
export function getDailyAttempt(dateKey: string, storage: Storage = localStorage): DailyAttempt | null {
  try {
    const raw = storage.getItem(ATTEMPT_KEY);
    if (raw === null) {
      return null;
    }
    const attempt = JSON.parse(raw) as DailyAttempt;
    return attempt.dateKey === dateKey ? attempt : null;
  } catch {
    return null;
  }
}

export function saveDailyAttempt(attempt: DailyAttempt, storage: Storage = localStorage): void {
  try {
    storage.setItem(ATTEMPT_KEY, JSON.stringify(attempt));
  } catch {
    // Not fatal: the player just gets another try.
  }
}

// The share text for the human in a finished daily.
export function buildShareText(game: GameState, dateKey: string, total: number): string {
  const human = game.players.find((player) => !player.isBot);
  const team = [];
  for (const item of human?.team ?? []) {
    team.push(item === null ? null : toPublicItem(item, false));
  }
  return dailyShareText(dateKey, total, team);
}

// The daily is Classic with no power-ups, so every move is a buy or a pass.
export function submitDaily(dateKey: string, playerName: string, moves: TurnMove[]): Promise<DailyResultResponse> {
  const dailyMoves: DailyResultPayload["moves"] = [];
  for (const move of moves) {
    if (move.type === "buy" || move.type === "pass") {
      dailyMoves.push({ type: move.type });
    }
  }
  return apiRequest<DailyResultResponse>("/api/daily", {
    method: "POST",
    body: { dateKey, playerName, moves: dailyMoves },
  });
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

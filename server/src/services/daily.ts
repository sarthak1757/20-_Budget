import {
  DAILY_BOT_ID,
  DAILY_PLAYER_ID,
  dailyNumber,
  replayDailyGame,
  toDateKey,
  type DailyLeaderboard,
  type DailyResultPayload,
  type DailyResultResponse,
  type SeedCategory,
} from "@budget-draft/shared";
import { HttpError } from "../middleware/errorHandler";
import { DailyResultModel } from "../models/DailyResult";

const DAILY_LEADERBOARD_SIZE = 20;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Today's daily, or yesterday's: someone who starts at 23:58 UTC should
// still be able to submit after midnight.
export function isOpenDailyDate(dateKey: string, now: Date): boolean {
  if (dailyNumber(dateKey) < 1) {
    return false;
  }
  const today = toDateKey(now);
  const yesterday = toDateKey(new Date(now.getTime() - MS_PER_DAY));
  return dateKey === today || dateKey === yesterday;
}

// Replays the moves, then stores the score. Throws a 400 when the moves don't
// make a real game and a 409 when this name already played today's daily.
export async function submitDailyResult(
  payload: DailyResultPayload,
  seeds: SeedCategory[],
  now: Date,
): Promise<DailyResultResponse> {
  if (!isOpenDailyDate(payload.dateKey, now)) {
    throw new HttpError(400, "That daily is closed");
  }
  const replay = replayDailyGame(payload.dateKey, seeds, payload.playerName, payload.moves);
  if (!replay.ok) {
    throw new HttpError(400, replay.error);
  }

  let total = 0;
  let botTotal = 0;
  for (const score of replay.results.scores) {
    if (score.playerId === DAILY_PLAYER_ID) {
      total = score.total;
    }
    if (score.playerId === DAILY_BOT_ID) {
      botTotal = score.total;
    }
  }

  const moves: string[] = [];
  for (const move of payload.moves) {
    moves.push(move.type);
  }
  try {
    await DailyResultModel.create({
      dateKey: payload.dateKey,
      playerName: payload.playerName,
      nameKey: payload.playerName.toLowerCase(),
      total,
      botTotal,
      moves,
    });
  } catch (error) {
    // 11000 is MongoDB's "duplicate key": the unique (date, name) index.
    if (error instanceof Error && "code" in error && error.code === 11000) {
      throw new HttpError(409, "That name already played today's daily");
    }
    throw error;
  }

  const better = await DailyResultModel.countDocuments({ dateKey: payload.dateKey, total: { $gt: total } });
  const players = await DailyResultModel.countDocuments({ dateKey: payload.dateKey });
  return { total, rank: better + 1, players };
}

export async function getDailyLeaderboard(dateKey: string): Promise<DailyLeaderboard> {
  const docs = await DailyResultModel.find({ dateKey })
    .sort({ total: -1, playedAt: 1 })
    .limit(DAILY_LEADERBOARD_SIZE)
    .lean();
  const entries = [];
  for (const doc of docs) {
    entries.push({ name: doc.playerName, total: doc.total, beatBot: doc.total > doc.botTotal });
  }
  return { dateKey, number: dailyNumber(dateKey), entries };
}

import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  applyAction,
  createDailyGame,
  DAILY_BOT_ID,
  decideBotAction,
  getCurrentPlayerId,
  toDateKey,
  type TurnMove,
} from "@budget-draft/shared";
import { createApp } from "../../app";
import { DailyResultModel } from "../../models/DailyResult";
import { RoomStore } from "../../rooms/roomStore";
import { loadAllSeedFiles } from "../../seed/loadSeedFiles";
import { isOpenDailyDate } from "../../services/daily";
import { startMemoryMongo } from "../../test/memoryMongo";

let stopMongo: () => Promise<void>;
// A fixed clock, so the tests don't depend on what day they run.
const NOW = new Date("2026-11-25T12:00:00Z");
const app = createApp({
  clientUrl: "http://localhost:5173",
  adminPassword: "test-admin-password",
  rooms: new RoomStore(),
  now: () => NOW,
});
const seeds = loadAllSeedFiles();
const today = toDateKey(NOW);

beforeAll(async () => {
  stopMongo = await startMemoryMongo();
  await DailyResultModel.init(); // builds the unique index before the tests rely on it
});

afterAll(async () => {
  await stopMongo();
});

beforeEach(async () => {
  await DailyResultModel.deleteMany({});
});

// Plays today's daily, buying anything rated at least `minRating`.
function playDaily(minRating: number): TurnMove[] {
  let state = createDailyGame(today, seeds, "Player");
  const moves: TurnMove[] = [];
  while (state.phase === "drafting") {
    const playerId = getCurrentPlayerId(state) ?? "";
    let move: TurnMove;
    if (playerId === DAILY_BOT_ID) {
      move = decideBotAction(state, playerId);
    } else {
      const canBuy = applyAction(state, { type: "buy", playerId }, 0).ok;
      move = canBuy && (state.currentItem?.rating ?? 0) >= minRating ? { type: "buy" } : { type: "pass" };
      moves.push(move);
    }
    const result = applyAction(state, { ...move, playerId }, 0);
    if (!result.ok) throw new Error(result.error);
    state = result.state;
  }
  return moves;
}

describe("POST /api/daily", () => {
  it("scores the moves by replaying them and ranks the player", async () => {
    const first = await request(app).post("/api/daily").send({ dateKey: today, playerName: "Asha", moves: playDaily(75) });
    expect(first.status).toBe(201);
    expect(first.body.total).toBeGreaterThan(0);
    expect(first.body).toMatchObject({ rank: 1, players: 1 });

    const second = await request(app).post("/api/daily").send({ dateKey: today, playerName: "Ben", moves: playDaily(60) });
    expect(second.status).toBe(201);
    expect(second.body.players).toBe(2);
  });

  it("allows one attempt per name per day, ignoring case", async () => {
    const moves = playDaily(70);
    expect((await request(app).post("/api/daily").send({ dateKey: today, playerName: "Asha", moves })).status).toBe(201);
    const again = await request(app).post("/api/daily").send({ dateKey: today, playerName: "ASHA", moves });
    expect(again.status).toBe(409);
  });

  it("rejects moves that don't make a real game", async () => {
    const moves = playDaily(70);
    const short = await request(app).post("/api/daily").send({ dateKey: today, playerName: "Cy", moves: moves.slice(1) });
    expect(short.status).toBe(400);
    const bad = await request(app).post("/api/daily").send({ dateKey: today, playerName: "Cy", moves: [{ type: "bid" }] });
    expect(bad.status).toBe(400);
  });

  it("only accepts today's or yesterday's daily", async () => {
    const res = await request(app).post("/api/daily").send({ dateKey: "2026-11-23", playerName: "Cy", moves: playDaily(70) });
    expect(res.status).toBe(400);
    const now = new Date("2026-12-01T00:05:00Z");
    expect(isOpenDailyDate("2026-12-01", now)).toBe(true);
    expect(isOpenDailyDate("2026-11-30", now)).toBe(true);
    expect(isOpenDailyDate("2026-11-29", now)).toBe(false);
    expect(isOpenDailyDate("2026-11-16", new Date("2026-11-17T00:00:00Z"))).toBe(false); // before Daily #1
  });
});

describe("GET /api/daily/leaderboard", () => {
  it("lists today's scores, best first", async () => {
    await request(app).post("/api/daily").send({ dateKey: today, playerName: "Asha", moves: playDaily(80) });
    await request(app).post("/api/daily").send({ dateKey: today, playerName: "Ben", moves: playDaily(55) });
    const res = await request(app).get("/api/daily/leaderboard");
    expect(res.status).toBe(200);
    expect(res.body.dateKey).toBe(today);
    expect(res.body.entries).toHaveLength(2);
    expect(res.body.entries[0].total).toBeGreaterThanOrEqual(res.body.entries[1].total);
    expect(typeof res.body.entries[0].beatBot).toBe("boolean");
    expect((await request(app).get("/api/daily/leaderboard?date=nope")).status).toBe(400);
  });
});

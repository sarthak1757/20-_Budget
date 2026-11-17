import { Router } from "express";
import { dailyDateSchema, dailyResultSchema, toDateKey, type SeedCategory } from "@budget-draft/shared";
import { parseOrThrow } from "../middleware/validate";
import { getDailyLeaderboard, submitDailyResult } from "../services/daily";

// The daily is built from the seed files (not the database), so admin edits
// can't change a daily that people are already playing.
export function dailyRouter(seeds: SeedCategory[], now: () => Date): Router {
  const router = Router();

  // POST /api/daily: { dateKey, playerName, moves }
  router.post("/", async (req, res) => {
    const payload = parseOrThrow(dailyResultSchema, req.body);
    res.status(201).json(await submitDailyResult(payload, seeds, now()));
  });

  // GET /api/daily/leaderboard?date=2026-11-18 (defaults to today, UTC)
  router.get("/leaderboard", async (req, res) => {
    const date = typeof req.query.date === "string" ? req.query.date : toDateKey(now());
    res.json(await getDailyLeaderboard(parseOrThrow(dailyDateSchema, date)));
  });

  return router;
}

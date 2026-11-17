import { Router } from "express";
import { getLeaderboard } from "../services/gameResults";

export function leaderboardRouter(): Router {
  const router = Router();
  router.get("/", async (_req, res) => {
    res.json(await getLeaderboard());
  });
  return router;
}

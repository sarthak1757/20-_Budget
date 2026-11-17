import { Router } from "express";
import { computeResults, localResultSchema } from "@budget-draft/shared";
import { parseOrThrow } from "../middleware/validate";
import { saveGameResult } from "../services/gameResults";
import { localResultToState } from "../services/localResults";

// POST /api/results: lets the browser store a finished local or bot game.
// These are saved with countsForLeaderboard = false (see saveGameResult).
export function resultsRouter(): Router {
  const router = Router();
  router.post("/", async (req, res) => {
    const submitted = parseOrThrow(localResultSchema, req.body);
    const state = localResultToState(submitted);
    await saveGameResult(state, computeResults(state));
    res.status(201).json({ ok: true });
  });
  return router;
}

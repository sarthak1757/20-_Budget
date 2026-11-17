import cors from "cors";
import express, { type Express } from "express";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import type { RoomStore } from "./rooms/roomStore";
import { categoriesRouter } from "./routes/categories";
import { leaderboardRouter } from "./routes/leaderboard";
import { roomsRouter } from "./routes/rooms";

export interface AppOptions {
  clientUrl: string;
  rooms: RoomStore;
}

// Builds the Express app without starting it, so tests can use it directly.
export function createApp(options: AppOptions): Express {
  const app = express();

  // Only our own front-end may call the API from a browser.
  app.use(cors({ origin: options.clientUrl }));
  app.use(express.json({ limit: "100kb" }));

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });
  app.use("/api/categories", categoriesRouter());
  app.use("/api/rooms", roomsRouter(options.rooms));
  app.use("/api/leaderboard", leaderboardRouter());

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

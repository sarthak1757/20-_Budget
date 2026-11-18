import { join } from "node:path";

// Folders the server reads at runtime.
//
// This file lives in server/src, and the production bundle lives in
// server/dist/index.js. Both are one folder below server/, so the same
// relative paths work in development (tsx) and in production (node dist).
// Keep any path that depends on import.meta.dirname in this file.
export const SERVER_ROOT = join(import.meta.dirname, "..");

// The JSON seed files: server/seed
export const SEED_DIR = join(SERVER_ROOT, "seed");

// The built React app: client/dist (created by `npm run build`).
export const CLIENT_DIST_DIR = join(SERVER_ROOT, "..", "client", "dist");

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Database tests start an in-memory MongoDB, which can take a few seconds the first time.
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
});

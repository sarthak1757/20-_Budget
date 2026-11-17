import { loadEnv } from "./config/env";
import { connectToDatabase } from "./db/connect";
import { createGameServer } from "./server";

async function main(): Promise<void> {
  const env = loadEnv();
  await connectToDatabase(env.MONGO_URI);

  const server = createGameServer({ clientUrl: env.CLIENT_URL, adminPassword: env.ADMIN_PASSWORD });
  server.httpServer.listen(env.PORT, () => {
    console.log(`Budget Draft server on http://localhost:${env.PORT}`);
  });

  // Ctrl+C / container stop: close sockets cleanly.
  const shutdown = () => {
    console.log("Shutting down…");
    server.close().finally(() => process.exit(0));
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

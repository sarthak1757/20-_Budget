// Usage: npm run seed
// Loads every JSON file in /server/seed and replaces the categories and items in MongoDB.
import { z } from "zod";
import { connectToDatabase, disconnectFromDatabase } from "../db/connect";
import { loadAllSeedFiles } from "../seed/loadSeedFiles";
import { seedDatabase } from "../seed/seedDatabase";

async function main(): Promise<void> {
  // Only MONGO_URI is needed here, so we don't require the full server env.
  const mongoUri = z.string().min(1).parse(process.env.MONGO_URI);

  // Validate every file BEFORE touching the database, so bad data
  // never leaves us with half-empty collections.
  const categories = loadAllSeedFiles();

  await connectToDatabase(mongoUri);
  const summary = await seedDatabase(categories);
  console.log(`Seeded ${summary.categories} categories and ${summary.items} items.`);
  await disconnectFromDatabase();
}

main().catch(async (error: unknown) => {
  console.error("Seeding failed:", error instanceof Error ? error.message : error);
  await disconnectFromDatabase();
  process.exit(1);
});

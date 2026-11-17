import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

// Starts a throwaway MongoDB for a test file and connects mongoose to it.
// Call in beforeAll; call the returned function in afterAll.
export async function startMemoryMongo(): Promise<() => Promise<void>> {
  const server = await MongoMemoryServer.create();
  await mongoose.connect(server.getUri());
  return async () => {
    await mongoose.disconnect();
    await server.stop();
  };
}

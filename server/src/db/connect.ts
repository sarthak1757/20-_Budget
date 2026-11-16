import mongoose from "mongoose";

export async function connectToDatabase(uri: string): Promise<void> {
  // Fail fast if MongoDB isn't reachable instead of buffering queries forever.
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  console.log(`Connected to MongoDB (${mongoose.connection.name})`);
}

export async function disconnectFromDatabase(): Promise<void> {
  await mongoose.disconnect();
}

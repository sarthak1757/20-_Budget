import mongoose from "mongoose";

// Used when the connection string doesn't name a database. Atlas's
// "Connect" dialog gives URIs like mongodb+srv://user:pass@host/?appName=x,
// and without this MongoDB would silently use a database called "test".
export const DEFAULT_DATABASE_NAME = "budget-draft";

// True if the URI has a database name between the hosts and the "?" options:
// mongodb://localhost:27017/budget-draft             -> true
// mongodb+srv://u:p@cluster.mongodb.net/?retryWrites -> false
export function uriHasDatabaseName(uri: string): boolean {
  const schemeEnd = uri.indexOf("://");
  const afterScheme = schemeEnd === -1 ? uri : uri.slice(schemeEnd + 3);
  // Special characters in the username and password must be percent-encoded,
  // so the first "/" after the scheme always ends the host list.
  const slash = afterScheme.indexOf("/");
  if (slash === -1) {
    return false;
  }
  const path = afterScheme.slice(slash + 1);
  const query = path.indexOf("?");
  const name = query === -1 ? path : path.slice(0, query);
  return name.length > 0;
}

export async function connectToDatabase(uri: string): Promise<void> {
  const options: mongoose.ConnectOptions = {
    // Fail fast if MongoDB isn't reachable instead of buffering queries forever.
    serverSelectionTimeoutMS: 5000,
  };
  if (!uriHasDatabaseName(uri)) {
    options.dbName = DEFAULT_DATABASE_NAME;
  }
  await mongoose.connect(uri, options);
  console.log(`Connected to MongoDB (database "${mongoose.connection.name}")`);
}

export async function disconnectFromDatabase(): Promise<void> {
  await mongoose.disconnect();
}

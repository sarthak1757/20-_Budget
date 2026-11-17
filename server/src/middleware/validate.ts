import type { z } from "zod";
import { HttpError } from "./errorHandler";

// Checks request data against a zod schema. Throws a 400 with the first problem
// so the client gets a useful message instead of a crash.
export function parseOrThrow<T extends z.ZodType>(schema: T, data: unknown): z.infer<T> {
  const result = schema.safeParse(data);
  if (!result.success) {
    const issue = result.error.issues[0];
    const field = issue && issue.path.length > 0 ? `${issue.path.join(".")}: ` : "";
    throw new HttpError(400, `${field}${issue?.message ?? "Invalid request"}`);
  }
  return result.data;
}

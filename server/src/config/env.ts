import { z } from "zod";

// Checked once at startup so a missing or mistyped variable fails loudly
// right away, instead of causing a confusing error deep inside a request.
const envSchema = z.object({
  MONGO_URI: z.string().min(1, "MONGO_URI is required, e.g. mongodb://localhost:27017/budget-draft"),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  ADMIN_PASSWORD: z.string().min(8, "ADMIN_PASSWORD must be at least 8 characters"),
  CLIENT_URL: z.url().default("http://localhost:5173"),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    const problems: string[] = [];
    for (const issue of result.error.issues) {
      problems.push(`  - ${issue.path.join(".")}: ${issue.message}`);
    }
    throw new Error(`Invalid environment variables (see .env.example):\n${problems.join("\n")}`);
  }
  return result.data;
}

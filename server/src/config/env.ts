import { z } from "zod";

// Checked once at startup so a missing or mistyped variable fails loudly
// right away, instead of causing a confusing error deep inside a request.
const DEV_CLIENT_URL = "http://localhost:5173";

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    MONGO_URI: z.string().min(1, "MONGO_URI is required, e.g. mongodb://localhost:27017/budget-draft"),
    PORT: z.coerce.number().int().min(1).max(65535).default(4000), // Render sets this
    ADMIN_PASSWORD: z.string().min(8, "ADMIN_PASSWORD must be at least 8 characters"),
    // The only origin allowed to call the API from another site (CORS).
    // In production this is the app's own public URL, e.g. https://budget-draft.onrender.com
    CLIENT_URL: z.url().optional(),
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV === "production" && env.CLIENT_URL === undefined) {
      ctx.addIssue({
        code: "custom",
        path: ["CLIENT_URL"],
        message: "CLIENT_URL is required in production, e.g. https://budget-draft.onrender.com",
      });
    }
  })
  .transform((env) => ({ ...env, CLIENT_URL: stripTrailingSlash(env.CLIENT_URL ?? DEV_CLIENT_URL) }));

// Browsers send the Origin header without a trailing slash, so
// "https://x.onrender.com/" would never match it.
function stripTrailingSlash(url: string): string {
  if (url.endsWith("/")) {
    return url.slice(0, -1);
  }
  return url;
}

export type Env = z.output<typeof envSchema>;

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

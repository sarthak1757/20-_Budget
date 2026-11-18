import { describe, expect, it } from "vitest";
import { loadEnv } from "../env";

const BASE = { MONGO_URI: "mongodb://localhost:27017/budget-draft", ADMIN_PASSWORD: "long-enough-password" };

describe("loadEnv", () => {
  it("uses development defaults when only the required values are set", () => {
    const env = loadEnv({ ...BASE });
    expect(env.NODE_ENV).toBe("development");
    expect(env.PORT).toBe(4000);
    expect(env.CLIENT_URL).toBe("http://localhost:5173");
  });

  it("reads PORT from the environment, as Render sets it", () => {
    expect(loadEnv({ ...BASE, PORT: "10000" }).PORT).toBe(10000);
  });

  it("requires CLIENT_URL in production", () => {
    expect(() => loadEnv({ ...BASE, NODE_ENV: "production" })).toThrow(/CLIENT_URL is required in production/);
  });

  it("drops a trailing slash from CLIENT_URL so it matches the browser's Origin header", () => {
    const env = loadEnv({ ...BASE, NODE_ENV: "production", CLIENT_URL: "https://budget-draft.onrender.com/" });
    expect(env.CLIENT_URL).toBe("https://budget-draft.onrender.com");
  });

  it("names every missing variable", () => {
    expect(() => loadEnv({})).toThrow(/MONGO_URI[\s\S]*ADMIN_PASSWORD/);
  });
});

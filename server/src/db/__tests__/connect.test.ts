import { describe, expect, it } from "vitest";
import { uriHasDatabaseName } from "../connect";

describe("uriHasDatabaseName", () => {
  it("finds the database name in local and Atlas URIs", () => {
    expect(uriHasDatabaseName("mongodb://localhost:27017/budget-draft")).toBe(true);
    expect(uriHasDatabaseName("mongodb+srv://user:p%40ss@cluster0.abc.mongodb.net/budget-draft?retryWrites=true")).toBe(true);
    expect(uriHasDatabaseName("mongodb://h1:27017,h2:27017/budget-draft?replicaSet=rs0")).toBe(true);
  });

  it("notices when there is none, as in Atlas's copy-paste URI", () => {
    expect(uriHasDatabaseName("mongodb+srv://user:pass@cluster0.abc.mongodb.net/?retryWrites=true&appName=Cluster0")).toBe(false);
    expect(uriHasDatabaseName("mongodb+srv://user:pass@cluster0.abc.mongodb.net")).toBe(false);
    expect(uriHasDatabaseName("mongodb://localhost:27017/")).toBe(false);
  });
});

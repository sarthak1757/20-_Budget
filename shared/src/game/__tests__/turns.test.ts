import { describe, expect, it } from "vitest";
import { buildTurnQueue, nextFirstPlayerIndex } from "../turns";
import { makeItem, makePlayer } from "./helpers";

const p1 = makePlayer({ id: "p1" });
const p2 = makePlayer({ id: "p2" });
const p3 = makePlayer({ id: "p3" });
const cheap = makeItem("cheap", 2, 40);

describe("buildTurnQueue", () => {
  it("starts at firstPlayerIndex and wraps around", () => {
    const result = buildTurnQueue([p1, p2, p3], 1, () => cheap.price);
    expect(result.queue).toEqual(["p2", "p3", "p1"]);
    expect(result.cantAfford).toEqual([]);
  });

  it("leaves out players whose team is full", () => {
    const full = makePlayer({ id: "p2", team: [cheap, cheap] });
    const result = buildTurnQueue([p1, full, p3], 0, () => cheap.price);
    expect(result.queue).toEqual(["p1", "p3"]);
    expect(result.cantAfford).toEqual([]);
  });

  it("lists players blocked by the budget rule separately", () => {
    const poor = makePlayer({ id: "p2", budget: 5 }); // 5 empty slots -> can spend $1
    const result = buildTurnQueue([p1, poor, p3], 0, () => cheap.price);
    expect(result.queue).toEqual(["p1", "p3"]);
    expect(result.cantAfford).toEqual(["p2"]);
  });
});

describe("nextFirstPlayerIndex", () => {
  it("moves one seat and wraps", () => {
    expect(nextFirstPlayerIndex(0, 3)).toBe(1);
    expect(nextFirstPlayerIndex(2, 3)).toBe(0);
  });
});

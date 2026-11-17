import { describe, expect, it } from "vitest";
import { canBuy, countEmptySlots, findFirstEmptySlot, getBuyBlockReason, getSpendBlockReason, maxSpendable } from "../rules";
import { makeItem, makePlayer } from "./helpers";

describe("countEmptySlots / findFirstEmptySlot", () => {
  it("counts nulls and finds the first one", () => {
    const filled = makeItem("a", 3, 50);
    const player = makePlayer({ team: [filled, null, filled, null, null] });
    expect(countEmptySlots(player)).toBe(3);
    expect(findFirstEmptySlot(player)).toBe(1);
  });

  it("returns -1 when the team is full", () => {
    const filled = makeItem("a", 3, 50);
    const player = makePlayer({ team: [filled, filled, filled] });
    expect(findFirstEmptySlot(player)).toBe(-1);
  });
});

describe("maxSpendable (keep $1 per other empty slot)", () => {
  it("$20 with 5 empty slots can spend $16", () => {
    expect(maxSpendable(makePlayer({ budget: 20 }))).toBe(16);
  });

  it("can spend everything on the last slot", () => {
    const filled = makeItem("a", 3, 50);
    const player = makePlayer({ budget: 3, team: [filled, filled, filled, filled, null] });
    expect(maxSpendable(player)).toBe(3);
  });

  it("is 0 when the team is full", () => {
    const filled = makeItem("a", 3, 50);
    expect(maxSpendable(makePlayer({ team: [filled] }))).toBe(0);
  });
});

describe("canBuy / getBuyBlockReason", () => {
  it("allows a buy that leaves exactly $1 per remaining slot", () => {
    const player = makePlayer({ budget: 20 });
    expect(canBuy(player, makeItem("x", 16, 90))).toBe(true);
  });

  it("blocks a buy that would leave too little for the other slots", () => {
    const player = makePlayer({ budget: 20 });
    const reason = getBuyBlockReason(player, makeItem("x", 17, 90));
    expect(reason).toContain("4 other empty slots");
  });

  it("blocks an item that costs more than the whole budget", () => {
    const filled = makeItem("a", 3, 50);
    const player = makePlayer({ budget: 2, team: [filled, filled, filled, filled, null] });
    expect(getBuyBlockReason(player, makeItem("x", 5, 90))).toBe("You only have $2");
  });

  it("blocks buying with a full team", () => {
    const filled = makeItem("a", 1, 50);
    const player = makePlayer({ team: [filled, filled] });
    expect(getBuyBlockReason(player, makeItem("x", 1, 90))).toBe("Your team is already full");
  });
});

describe("getSpendBlockReason", () => {
  it("applies the same budget rule to any amount, such as a bid", () => {
    const player = makePlayer({ budget: 5, team: [null, null, null] });
    expect(getSpendBlockReason(player, 3)).toBeNull();
    expect(getSpendBlockReason(player, 4)).toBe("You must keep $1 for each of your 2 other empty slots");
  });
});

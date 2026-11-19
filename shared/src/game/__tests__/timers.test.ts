import { describe, expect, it } from "vitest";
import { onlineTimersSchema } from "../../schemas";
import { BID_SECONDS_OPTIONS, TURN_SECONDS_OPTIONS, VOTE_SECONDS_OPTIONS } from "../constants";
import { applyAction } from "../engine";
import { secondsPerTurn } from "../timers";
import { makeSettings, NOW, startGame } from "./helpers";

describe("secondsPerTurn", () => {
  it("uses the turn timer in Classic and the bid timer in Auction", () => {
    expect(secondsPerTurn(makeSettings({ turnSeconds: 30, bidSeconds: 5 }))).toBe(30);
    expect(secondsPerTurn(makeSettings({ draftStyle: "auction", turnSeconds: 30, bidSeconds: 5 }))).toBe(5);
  });

  it("treats a missing bid timer (an old saved game) as no timer", () => {
    const old = { ...makeSettings({ draftStyle: "auction" }), bidSeconds: undefined } as unknown as ReturnType<typeof makeSettings>;
    expect(secondsPerTurn(old)).toBe(0);
  });
});

describe("turn deadlines", () => {
  it("gives every auction turn the bid timer", () => {
    const state = startGame({ settings: { draftStyle: "auction", turnSeconds: 30, bidSeconds: 10 } });
    expect(state.turnDeadline).toBe(NOW + 10_000);
    const result = applyAction(state, { type: "bid", playerId: "p1", amount: 1 }, NOW + 2000);
    if (!result.ok) throw new Error(result.error);
    expect(result.state.turnDeadline).toBe(NOW + 2000 + 10_000);
  });

  it("gives Classic turns the turn timer, whatever the bid timer is", () => {
    expect(startGame({ settings: { turnSeconds: 45, bidSeconds: 5 } }).turnDeadline).toBe(NOW + 45_000);
  });
});

describe("onlineTimersSchema", () => {
  it("accepts every preset", () => {
    for (const turnSeconds of TURN_SECONDS_OPTIONS) {
      for (const bidSeconds of BID_SECONDS_OPTIONS) {
        for (const voteSeconds of VOTE_SECONDS_OPTIONS) {
          expect(onlineTimersSchema.safeParse({ turnSeconds, bidSeconds, voteSeconds }).success).toBe(true);
        }
      }
    }
  });

  it("rejects anything that isn't a preset, including 0 (no timer)", () => {
    const valid = { turnSeconds: 15, bidSeconds: 7, voteSeconds: 30 };
    for (const bad of [{ turnSeconds: 0 }, { turnSeconds: 12 }, { turnSeconds: 15.5 }, { bidSeconds: 6 }, { voteSeconds: 120 }, { turnSeconds: "15" }]) {
      expect(onlineTimersSchema.safeParse({ ...valid, ...bad }).success).toBe(false);
    }
  });

  it("fills in the defaults for a client that sends no timers", () => {
    expect(onlineTimersSchema.parse({})).toEqual({ turnSeconds: 15, bidSeconds: 7, voteSeconds: 30 });
  });
});

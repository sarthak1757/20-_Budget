import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { getCurrentPlayerId } from "@budget-draft/shared";
import { SocketTestHarness, waitForState } from "../../test/socketTestUtils";

const harness = new SocketTestHarness();

beforeAll(() => harness.start());
afterEach(() => harness.disconnectAll());
afterAll(() => harness.stop());

describe("online auction", () => {
  it("uses the auction turn timer and starts with no bids", async () => {
    const { state } = await harness.startGame(["Asha", "Ben"], 3, { draftStyle: "auction" });
    expect(state.settings.draftStyle).toBe("auction");
    expect(state.auction).toEqual({ highBid: 0, highBidderId: null });
  });

  it("accepts a valid bid, rejects a low one, and awards the item to the high bidder", async () => {
    const { clients, host, ids, state } = await harness.startGame(["Asha", "Ben"], 3, { draftStyle: "auction" });
    const firstId = getCurrentPlayerId(state) ?? "";
    const secondId = ids.find((id) => id !== firstId) ?? "";
    const first = clients.get(firstId);
    const second = clients.get(secondId);
    if (!first || !second) throw new Error("missing clients");
    const round = state.roundNumber;

    const afterBid = waitForState(host, (s) => s.auction?.highBid === 3);
    const bid = await first.emitWithAck("turn:action", { action: "bid", amount: 3, roundNumber: round });
    expect(bid).toEqual({ ok: true, data: null });
    expect((await afterBid).auction?.highBidderId).toBe(firstId);

    const low = await second.emitWithAck("turn:action", { action: "bid", amount: 3, roundNumber: round });
    expect(low).toEqual({ ok: false, error: "The bid must be at least $4" });

    const nextItem = waitForState(host, (s) => s.roundNumber > round);
    await second.emitWithAck("turn:action", { action: "pass", roundNumber: round });
    const after = await nextItem;
    const winner = after.players.find((p) => p.id === firstId);
    expect(winner?.budget).toBe(17);
    expect(after.lastEvents).toContainEqual(expect.objectContaining({ type: "bought", playerId: firstId, price: 3 }));
  });

  it("rejects a bid without an amount", async () => {
    const { clients, state } = await harness.startGame(["Asha", "Ben"], 3, { draftStyle: "auction" });
    const acting = clients.get(getCurrentPlayerId(state) ?? "");
    const res = await acting?.emitWithAck("turn:action", { action: "bid", roundNumber: state.roundNumber } as never);
    expect(res?.ok).toBe(false);
  });
});

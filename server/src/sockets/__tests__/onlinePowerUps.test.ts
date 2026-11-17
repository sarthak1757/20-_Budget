import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { getCurrentPlayerId, type PublicGameState } from "@budget-draft/shared";
import { SocketTestHarness, waitForState } from "../../test/socketTestUtils";

const harness = new SocketTestHarness();

beforeAll(() => harness.start());
afterEach(() => harness.disconnectAll());
afterAll(() => harness.stop());

describe("online power-ups", () => {
  it("sends a peeked item only to the player who peeked", async () => {
    const { clients, ids, host, state } = await harness.startGame(["Asha", "Ben"], 3, { powerUps: true });
    const peekerId = getCurrentPlayerId(state) ?? "";
    const otherId = ids.find((id) => id !== peekerId) ?? "";
    const peeker = clients.get(peekerId);
    const other = clients.get(otherId);
    if (!peeker || !other) throw new Error("missing clients");

    // Everything the other player receives from now on.
    const otherSaw: string[] = [];
    other.onAny((_event, payload: unknown) => otherSaw.push(JSON.stringify(payload)));

    const marked = waitForState(host, (s: PublicGameState) => s.lastEvents.some((e) => e.type === "peeked"));
    const res = await peeker.emitWithAck("turn:peek", { roundNumber: state.roundNumber });
    if (!res.ok) throw new Error(res.error);
    const afterPeek = await marked;

    expect(afterPeek.players.find((p) => p.id === peekerId)?.usedPowerUps).toEqual(["peek"]);
    expect(otherSaw.length).toBeGreaterThan(0);
    for (const message of otherSaw) {
      expect(message).not.toContain(res.data.item.id);
    }

    const again = await peeker.emitWithAck("turn:peek", { roundNumber: state.roundNumber });
    expect(again).toEqual({ ok: false, error: "You've already used that one" });
  });

  it("applies a veto through turn:action", async () => {
    const { clients, host, state } = await harness.startGame(["Asha", "Ben"], 3, { powerUps: true });
    const current = clients.get(getCurrentPlayerId(state) ?? "");
    const nextRound = waitForState(host, (s) => s.roundNumber > state.roundNumber);
    const res = await current?.emitWithAck("turn:action", { action: "veto", roundNumber: state.roundNumber });
    expect(res).toEqual({ ok: true, data: null });
    expect((await nextRound).lastEvents[0]).toMatchObject({ type: "vetoed" });
  });

  it("refuses power-ups when the extra is off", async () => {
    const { clients, state } = await harness.startGame(["Asha", "Ben"]);
    const current = clients.get(getCurrentPlayerId(state) ?? "");
    const res = await current?.emitWithAck("turn:peek", { roundNumber: state.roundNumber });
    expect(res).toEqual({ ok: false, error: "Power-ups are off in this game" });
  });
});

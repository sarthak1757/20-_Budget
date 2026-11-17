import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import type { Reaction } from "@budget-draft/shared";
import { SocketTestHarness } from "../../test/socketTestUtils";

const harness = new SocketTestHarness();

beforeAll(() => harness.start());
afterEach(() => harness.disconnectAll());
afterAll(() => harness.stop());

describe("emoji reactions", () => {
  it("sends a reaction to everyone in the room, rate-limited and from the fixed set", async () => {
    const { clients, ids, host } = await harness.startGame(["Asha", "Ben"], 3);
    const ben = clients.get(ids[1] ?? "");
    if (!ben) throw new Error("missing Ben");

    const received = new Promise<Reaction>((resolve) => ben.once("reaction", resolve));
    expect(await host.emitWithAck("reaction:send", { emoji: "🔥" })).toEqual({ ok: true, data: null });
    expect(await received).toMatchObject({ playerId: ids[0], playerName: "Asha", emoji: "🔥" });

    expect(await host.emitWithAck("reaction:send", { emoji: "👏" })).toEqual({
      ok: false,
      error: "Slow down! One reaction per second.",
    });
    // @ts-expect-error: not one of the allowed emojis
    expect(await ben.emitWithAck("reaction:send", { emoji: "🍕" })).toEqual({ ok: false, error: "That reaction isn't available" });
  });
});

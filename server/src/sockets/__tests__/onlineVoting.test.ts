import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import type { GameResults, PublicGameState } from "@budget-draft/shared";
import { buyUntilDraftEnds, SocketTestHarness } from "../../test/socketTestUtils";

const harness = new SocketTestHarness();

beforeAll(() => harness.start());
afterEach(() => harness.disconnectAll());
afterAll(() => harness.stop());

function nextGameEnd(client: { on: (event: "game:end", cb: (p: { state: PublicGameState; results: GameResults }) => void) => void }) {
  return new Promise<{ state: PublicGameState; results: GameResults }>((resolve) => client.on("game:end", resolve));
}

describe("online voting", () => {
  it("holds a vote with 3 players, rejects self-votes and reports the vote winner", async () => {
    const { clients, ids, host, state } = await harness.startGame(["Asha", "Ben", "Chen"]);
    const afterDraft = await buyUntilDraftEnds(clients, host, state);
    expect(afterDraft.phase).toBe("voting");
    expect(afterDraft.voteDeadline).not.toBeNull();

    const [ashaId, benId, chenId] = ids as [string, string, string];
    const asha = clients.get(ashaId);
    const ben = clients.get(benId);
    const chen = clients.get(chenId);
    if (!asha || !ben || !chen) throw new Error("missing clients");

    expect(await asha.emitWithAck("vote:cast", { targetPlayerId: ashaId })).toEqual({
      ok: false,
      error: "You can't vote for yourself",
    });

    const end = nextGameEnd(asha);
    await asha.emitWithAck("vote:cast", { targetPlayerId: chenId });
    await ben.emitWithAck("vote:cast", { targetPlayerId: chenId });
    await chen.emitWithAck("vote:cast", { targetPlayerId: ashaId });

    const { results } = await end;
    expect(results.votingHeld).toBe(true);
    expect(results.voteWinnerIds).toEqual([chenId]);
    expect(results.statsWinnerIds.length).toBeGreaterThan(0);
  });

  it("ends the vote when the timer runs out", async () => {
    const { clients, host, state } = await harness.startGame(["Asha", "Ben", "Chen"]);
    await buyUntilDraftEnds(clients, host, state);
    const { state: finalState, results } = await nextGameEnd(host);
    expect(finalState.phase).toBe("finished");
    expect(results.voteWinnerIds).toEqual([]); // nobody voted
  });
});

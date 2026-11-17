import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import type { PublicGameState } from "@budget-draft/shared";
import { buyUntilDraftEnds, SocketTestHarness, waitForState, type Client } from "../../test/socketTestUtils";

const harness = new SocketTestHarness();

beforeAll(() => harness.start());
afterEach(() => harness.disconnectAll());
afterAll(() => harness.stop());

function waitForRoomUpdate(client: Client) {
  return new Promise<{ hostId: string | null; game: PublicGameState | null }>((resolve) => client.once("room:update", resolve));
}

// Plays a 2-player game to the end (2 players means no vote).
async function finishedGame() {
  const game = await harness.startGame(["Asha", "Ben"], 3);
  const end = waitForState(game.host, (state) => state.phase === "finished");
  await buyUntilDraftEnds(game.clients, game.host, game.state);
  const finalState = await end;
  return { ...game, finalState };
}

describe("rematch", () => {
  it("starts a new game in the same room with the same players", async () => {
    const { clients, ids, host, finalState } = await finishedGame();
    expect(finalState.players[0]?.team.every((slot) => slot !== null)).toBe(true);

    const ben = clients.get(ids[1] ?? "");
    if (!ben) throw new Error("missing Ben");
    expect(await ben.emitWithAck("game:rematch")).toEqual({ ok: false, error: "Only the host can start a rematch" });

    const update = waitForRoomUpdate(ben);
    expect(await host.emitWithAck("game:rematch")).toEqual({ ok: true, data: null });
    const { game } = await update;
    expect(game?.phase).toBe("drafting");
    expect(game?.roundNumber).toBe(1);
    expect(game?.players.map((player) => player.id)).toEqual(ids);
    for (const player of game?.players ?? []) {
      expect(player.team.every((slot) => slot === null)).toBe(true);
      expect(player.budget).toBe(game?.settings.startingBudget);
    }
  });

  it("is refused while a game is still running", async () => {
    const { host } = await harness.startGame(["Asha", "Ben"], 3);
    expect(await host.emitWithAck("game:rematch")).toEqual({
      ok: false,
      error: "You can only rematch after the game ends",
    });
  });

  it("passes the host on the results screen if the host leaves", async () => {
    const { clients, ids, host } = await finishedGame();
    const ben = clients.get(ids[1] ?? "");
    if (!ben) throw new Error("missing Ben");
    const update = waitForRoomUpdate(ben);
    host.disconnect();
    expect((await update).hostId).toBe(ids[1]);
    // Only Ben is left, so there aren't enough players for a rematch.
    expect(await ben.emitWithAck("game:rematch")).toEqual({ ok: false, error: "You need at least 2 players to start" });
  });
});

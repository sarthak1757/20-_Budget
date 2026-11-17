import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import type { PublicGameState, PublicItem } from "@budget-draft/shared";
import { buyUntilDraftEnds, SocketTestHarness } from "../../test/socketTestUtils";

const harness = new SocketTestHarness();

beforeAll(() => harness.start());
afterEach(() => harness.disconnectAll());
afterAll(() => harness.stop());

// Plays one quick online game with mystery items and returns every item a
// player was sent while the draft ran, plus the final state.
async function playOneGame(): Promise<{ seenDuringDraft: PublicItem[]; final: PublicGameState }> {
  const { clients, host, state } = await harness.startGame(["Asha", "Ben"], 7, { mysteryItems: true });
  const seenDuringDraft: PublicItem[] = [];
  const record = (game: PublicGameState) => {
    if (game.phase !== "drafting") return;
    if (game.currentItem) seenDuringDraft.push(game.currentItem);
    for (const player of game.players) {
      for (const item of player.team) {
        if (item) seenDuringDraft.push(item);
      }
    }
  };
  host.on("game:state", record);
  host.on("item:reveal", ({ item, state: revealed }) => {
    seenDuringDraft.push(item);
    record(revealed);
  });
  const ended = new Promise<PublicGameState>((resolve) => host.on("game:end", ({ state: end }) => resolve(end)));
  await buyUntilDraftEnds(clients, host, state);
  return { seenDuringDraft, final: await ended };
}

describe("online mystery items", () => {
  it("never sends a mystery rating during the draft, and reveals them at the end", async () => {
    // Mysteries are random (1 in 6), so a single 14-item game has about an 8%
    // chance of having none. Play until one shows up; 5 misses in a row is
    // under 1 in 100,000.
    let mysteries: PublicItem[] = [];
    let final: PublicGameState | null = null;
    for (let attempt = 0; attempt < 5 && mysteries.length === 0; attempt++) {
      const game = await playOneGame();
      mysteries = game.seenDuringDraft.filter((item) => item.isMystery === true);
      final = game.final;
      harness.disconnectAll();
    }

    expect(mysteries.length).toBeGreaterThan(0);
    for (const item of mysteries) {
      expect(item.rating).toBeNull();
    }
    for (const player of final?.players ?? []) {
      for (const item of player.team) {
        expect(item?.rating).not.toBeNull();
      }
    }
  });
});

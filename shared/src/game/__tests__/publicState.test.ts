import { describe, expect, it } from "vitest";
import { shuffle } from "../shuffle";
import { toPublicState } from "../publicState";
import { applyAction } from "../engine";
import { makeItem, makeItems, startGame } from "./helpers";

describe("toPublicState", () => {
  it("removes the item pool and reports only how many items are left", () => {
    const state = startGame({ items: makeItems(10) });
    const visible = toPublicState(state);
    expect("itemPool" in visible).toBe(false);
    expect(visible.itemsRemaining).toBe(9); // one is on the table
    // Make sure it really is gone after JSON (what Socket.io sends).
    expect(JSON.stringify(visible)).not.toContain("itemPool");
  });

  it("hides a mystery item's rating everywhere while the draft runs", () => {
    const mystery = { ...makeItem("m", 3, 77), isMystery: true };
    const state = startGame({ items: [mystery, ...makeItems(10)] });
    const visible = toPublicState(state);
    expect(visible.currentItem).toMatchObject({ id: "m", rating: null, price: 3, isMystery: true });

    // Bought: hidden in the buyer's team and in the event too.
    const bought = applyAction(state, { type: "buy", playerId: "p1" }, 0);
    if (!bought.ok) throw new Error(bought.error);
    const afterBuy = toPublicState(bought.state);
    expect(afterBuy.players[0]?.team[0]?.rating).toBeNull();
    const event = afterBuy.lastEvents[0];
    expect(event?.type === "bought" ? event.item.rating : "wrong event").toBeNull();
    expect(JSON.stringify(afterBuy)).not.toContain("77");
  });

  it("reveals mystery ratings once the draft is over", () => {
    const mystery = { ...makeItem("m", 3, 77), isMystery: true };
    const state = startGame({ items: [mystery, ...makeItems(10)] });
    const finished = toPublicState({ ...state, phase: "finished" });
    expect(finished.currentItem?.rating).toBe(77);
  });

  it("leaves normal items alone", () => {
    const visible = toPublicState(startGame({ items: makeItems(5, 2, 64) }));
    expect(visible.currentItem?.rating).toBe(64);
  });
});

describe("shuffle", () => {
  it("keeps every item and does not change the input", () => {
    const input = [1, 2, 3, 4, 5, 6];
    const output = shuffle(input);
    expect(input).toEqual([1, 2, 3, 4, 5, 6]);
    expect([...output].sort()).toEqual(input);
  });
});

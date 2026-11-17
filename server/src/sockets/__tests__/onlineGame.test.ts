import type { AddressInfo } from "node:net";
import { io as connect, type Socket } from "socket.io-client";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import {
  getCurrentPlayerId,
  type ClientToServerEvents,
  type GameResults,
  type PublicGameState,
  type RoomSnapshot,
  type ServerToClientEvents,
} from "@budget-draft/shared";
import { GameResultModel } from "../../models/GameResult";
import { RoomStore } from "../../rooms/roomStore";
import { loadAllSeedFiles } from "../../seed/loadSeedFiles";
import { seedDatabase } from "../../seed/seedDatabase";
import { createGameServer, type RunningGameServer } from "../../server";
import { startMemoryMongo } from "../../test/memoryMongo";

type Client = Socket<ServerToClientEvents, ClientToServerEvents>;

let stopMongo: () => Promise<void>;
let server: RunningGameServer;
let url: string;
const openClients: Client[] = [];

beforeAll(async () => {
  stopMongo = await startMemoryMongo();
  await seedDatabase(loadAllSeedFiles());
  // Short timers so the timeout tests run quickly.
  server = createGameServer({
    clientUrl: "http://localhost:5173",
    rooms: new RoomStore({ turnSeconds: 1, voteSeconds: 1 }),
  });
  await new Promise<void>((resolve) => server.httpServer.listen(0, resolve));
  const { port } = server.httpServer.address() as AddressInfo;
  url = `http://localhost:${port}`;
});

afterEach(() => {
  for (const client of openClients.splice(0)) {
    client.disconnect();
  }
});

afterAll(async () => {
  await server.close();
  await stopMongo();
});

async function newClient(): Promise<Client> {
  const client: Client = connect(url, { transports: ["websocket"], forceNew: true, reconnection: false });
  openClients.push(client);
  await new Promise<void>((resolve) => client.on("connect", () => resolve()));
  return client;
}

async function createRoom(categorySlug = "football"): Promise<string> {
  const res = await fetch(`${url}/api/rooms`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ categorySlug }),
  });
  const body = (await res.json()) as { code: string };
  return body.code;
}

async function join(client: Client, code: string, playerName: string, playerId?: string) {
  const payload = playerId === undefined ? { code, playerName } : { code, playerName, playerId };
  const res = await client.emitWithAck("room:join", payload);
  if (!res.ok) throw new Error(res.error);
  return res.data;
}

// Resolves with the next game state any client receives that matches `check`.
function waitForState(client: Client, check: (state: PublicGameState) => boolean, timeoutMs = 5000) {
  return new Promise<PublicGameState>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Timed out waiting for state")), timeoutMs);
    const onState = (state: PublicGameState) => {
      if (check(state)) {
        clearTimeout(timer);
        client.off("game:state", onState);
        client.off("item:reveal", onReveal);
        resolve(state);
      }
    };
    const onReveal = (payload: { state: PublicGameState }) => onState(payload.state);
    client.on("game:state", onState);
    client.on("item:reveal", onReveal);
  });
}

async function startTwoPlayerGame(slotCount = 3) {
  const code = await createRoom();
  const asha = await newClient();
  const ben = await newClient();
  const ashaJoin = await join(asha, code, "Asha");
  const benJoin = await join(ben, code, "Ben");
  const settings = { ...ashaJoin.room.settings, slotCount };
  expect(await asha.emitWithAck("room:settings", settings)).toEqual({ ok: true, data: null });

  const firstReveal = waitForState(asha, (state) => state.roundNumber === 1);
  expect(await asha.emitWithAck("game:start")).toEqual({ ok: true, data: null });
  const state = await firstReveal;
  return { code, asha, ben, ashaId: ashaJoin.playerId, benId: benJoin.playerId, state };
}

describe("online game over Socket.io", () => {
  it("plays a full game between two clients and saves the result", async () => {
    await GameResultModel.deleteMany({});
    const { code, asha, ben, ashaId, benId, state: firstState } = await startTwoPlayerGame(3);
    const clients = new Map<string, Client>([
      [ashaId, asha],
      [benId, ben],
    ]);

    const gameEnd = new Promise<{ state: PublicGameState; results: GameResults }>((resolve) => {
      ben.on("game:end", resolve);
    });

    // Whoever's turn it is buys, until every slot is full.
    let state = firstState;
    expect("itemPool" in state).toBe(false); // the pool never reaches clients
    while (state.phase === "drafting") {
      const currentId = getCurrentPlayerId(state);
      const client = currentId === null ? undefined : clients.get(currentId);
      if (!client) throw new Error("No current player");
      const round = state.roundNumber;
      const next = waitForState(asha, (s) => s.roundNumber > round || s.phase !== "drafting").catch(() => null);
      const res = await client.emitWithAck("turn:action", { action: "buy", roundNumber: round });
      expect(res).toEqual({ ok: true, data: null });
      const updated = await next;
      if (updated === null) break; // game:end was sent instead of a state
      state = updated;
    }

    const end = await gameEnd;
    expect(end.state.phase).toBe("finished"); // 2 players: no vote
    expect(end.results.votingHeld).toBe(false);
    for (const player of end.state.players) {
      expect(player.team.every((slot) => slot !== null)).toBe(true);
    }

    // Saving happens right after game:end; give it a moment.
    await new Promise((resolve) => setTimeout(resolve, 200));
    const saved = await GameResultModel.find({ roomCode: code }).lean();
    expect(saved.length).toBe(1);
    expect(saved[0]?.countsForLeaderboard).toBe(true);
    expect(saved[0]?.players.map((p) => p.name).sort()).toEqual(["Asha", "Ben"]);
  });

  it("rejects bad payloads, out-of-turn actions and stale clicks", async () => {
    const { asha, ben, ashaId, state } = await startTwoPlayerGame();
    const currentIsAsha = getCurrentPlayerId(state) === ashaId;
    const waiting = currentIsAsha ? ben : asha;
    const acting = currentIsAsha ? asha : ben;

    const bad = await acting.emitWithAck("turn:action", { action: "steal", roundNumber: 1 } as never);
    expect(bad.ok).toBe(false);
    const outOfTurn = await waiting.emitWithAck("turn:action", { action: "buy", roundNumber: state.roundNumber });
    expect(outOfTurn).toEqual({ ok: false, error: "It's not your turn" });
    const stale = await acting.emitWithAck("turn:action", { action: "buy", roundNumber: state.roundNumber + 5 });
    expect(stale).toEqual({ ok: false, error: "That item is gone. Too slow!" });
    const notHost = await ben.emitWithAck("game:start");
    expect(notHost.ok).toBe(false);
  });

  it("auto-passes when the turn timer runs out", async () => {
    const { asha, state } = await startTwoPlayerGame();
    const firstPlayer = getCurrentPlayerId(state);
    const afterTimeout = await waitForState(asha, (s) =>
      s.lastEvents.some((e) => e.type === "passed" && e.auto && e.playerId === firstPlayer),
    );
    expect(getCurrentPlayerId(afterTimeout)).not.toBe(firstPlayer);
  });

  it("lets a player reconnect to their seat with the stored id", async () => {
    const { code, ben, benId } = await startTwoPlayerGame();
    ben.disconnect();
    const benAgain = await newClient();
    const rejoin = await join(benAgain, code, "Ben", benId);
    expect(rejoin.playerId).toBe(benId);
    expect(rejoin.room.game?.phase).toBe("drafting");
    const benInGame = rejoin.room.game?.players.find((p) => p.id === benId);
    expect(benInGame?.isConnected).toBe(true);
  });

  it("refuses new players once the game has started", async () => {
    const { code } = await startTwoPlayerGame();
    const late = await newClient();
    const res = await late.emitWithAck("room:join", { code, playerName: "Late" });
    expect(res).toEqual({ ok: false, error: "This game has already started" });
  });

  it("passes host to the next player when the host leaves the lobby", async () => {
    const code = await createRoom();
    const asha = await newClient();
    const ben = await newClient();
    await join(asha, code, "Asha");
    const benJoin = await join(ben, code, "Ben");

    const update = new Promise<RoomSnapshot>((resolve) => {
      ben.on("room:update", (room) => {
        if (room.players.some((p) => !p.isConnected)) resolve(room);
      });
    });
    asha.disconnect();
    const room = await update;
    expect(room.hostId).toBe(benJoin.playerId);
  });
});

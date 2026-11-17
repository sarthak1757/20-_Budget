import { peekSchema, turnActionSchema, voteCastSchema, type PublicItem } from "@budget-draft/shared";
import type { Room } from "../rooms/room";
import type { SocketContext } from "./context";
import { safeAck, type GameSocket } from "./types";

// Finds the room and player for this socket, or explains why we can't.
function getSeat(socket: GameSocket, ctx: SocketContext): { room: Room; playerId: string } | string {
  const { roomCode, playerId } = socket.data;
  if (roomCode === undefined || playerId === undefined) {
    return "You're not in a room";
  }
  const room = ctx.rooms.get(roomCode);
  if (!room) {
    return "This room no longer exists";
  }
  return { room, playerId };
}

export function registerGameHandlers(socket: GameSocket, ctx: SocketContext): void {
  socket.on("game:start", async (ack) => {
    const reply = safeAck<null>(ack);
    const seat = getSeat(socket, ctx);
    if (typeof seat === "string") {
      reply({ ok: false, error: seat });
      return;
    }
    if (seat.room.hostId !== seat.playerId) {
      reply({ ok: false, error: "Only the host can start the game" });
      return;
    }
    const result = await ctx.runner.startGame(seat.room);
    reply(result.ok ? { ok: true, data: null } : result);
  });

  socket.on("turn:action", (payload, ack) => {
    const reply = safeAck<null>(ack);
    const parsed = turnActionSchema.safeParse(payload);
    if (!parsed.success) {
      reply({ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid action" });
      return;
    }
    const seat = getSeat(socket, ctx);
    if (typeof seat === "string") {
      reply({ ok: false, error: seat });
      return;
    }
    // The player id comes from the socket, never from the payload,
    // so nobody can act on someone else's behalf.
    const result = ctx.runner.handleAction(seat.room, seat.playerId, parsed.data);
    reply(result.ok ? { ok: true, data: null } : result);
  });

  socket.on("turn:peek", (payload, ack) => {
    const reply = safeAck<{ item: PublicItem }>(ack);
    const parsed = peekSchema.safeParse(payload);
    if (!parsed.success) {
      reply({ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid request" });
      return;
    }
    const seat = getSeat(socket, ctx);
    if (typeof seat === "string") {
      reply({ ok: false, error: seat });
      return;
    }
    const result = ctx.runner.handlePeek(seat.room, seat.playerId, parsed.data.roundNumber);
    reply(result.ok ? { ok: true, data: { item: result.item } } : result);
  });

  socket.on("vote:cast", (payload, ack) => {
    const reply = safeAck<null>(ack);
    const parsed = voteCastSchema.safeParse(payload);
    if (!parsed.success) {
      reply({ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid vote" });
      return;
    }
    const seat = getSeat(socket, ctx);
    if (typeof seat === "string") {
      reply({ ok: false, error: seat });
      return;
    }
    const result = ctx.runner.handleVote(seat.room, seat.playerId, parsed.data.targetPlayerId);
    reply(result.ok ? { ok: true, data: null } : result);
  });
}

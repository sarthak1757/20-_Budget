import type { Item, OnlineTimers } from "@budget-draft/shared";
import { createRoom, type Room } from "./room";
import { generateRoomCode } from "./roomCode";

// Rooms with nobody connected for this long are deleted.
export const EMPTY_ROOM_TTL_MS = 10 * 60 * 1000;

// All live rooms, in memory. A Map is enough for one server process;
// running several servers would need shared storage (e.g. Redis).
export class RoomStore {
  private rooms = new Map<string, Room>();

  // timerOverride is for tests: short timers so games finish in a second or two.
  constructor(private readonly timerOverride: OnlineTimers | null = null) {}

  create(categorySlug: string, now: number, customItems: Item[] | null = null): Room {
    const code = generateRoomCode((candidate) => this.rooms.has(candidate));
    const room = createRoom(code, categorySlug, now, this.timerOverride, customItems);
    this.rooms.set(code, room);
    return room;
  }

  get(code: string): Room | undefined {
    return this.rooms.get(code.trim().toUpperCase());
  }

  delete(code: string): void {
    this.rooms.delete(code);
  }

  all(): Room[] {
    return [...this.rooms.values()];
  }

  // Returns the codes of rooms that have been empty for too long, and removes them.
  removeAbandoned(now: number, ttlMs: number = EMPTY_ROOM_TTL_MS): string[] {
    const removed: string[] = [];
    for (const room of this.rooms.values()) {
      if (room.emptySince !== null && now - room.emptySince >= ttlMs) {
        removed.push(room.code);
      }
    }
    for (const code of removed) {
      this.rooms.delete(code);
    }
    return removed;
  }
}

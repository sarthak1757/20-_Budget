import { Router } from "express";
import { createRoomSchema, roomCodeSchema, type CreateRoomResponse } from "@budget-draft/shared";
import { HttpError } from "../middleware/errorHandler";
import { parseOrThrow } from "../middleware/validate";
import { toRoomInfo } from "../rooms/room";
import type { RoomStore } from "../rooms/roomStore";
import { categoryExists } from "../services/catalog";

export function roomsRouter(rooms: RoomStore): Router {
  const router = Router();

  // Creates an empty room. The creator then joins over Socket.io and becomes host.
  router.post("/", async (req, res) => {
    const body = parseOrThrow(createRoomSchema, req.body);
    if (!(await categoryExists(body.categorySlug))) {
      throw new HttpError(404, `Category "${body.categorySlug}" not found`);
    }
    const room = rooms.create(body.categorySlug, Date.now());
    const response: CreateRoomResponse = { code: room.code };
    res.status(201).json(response);
  });

  // Lets the join page check a code before connecting.
  router.get("/:code", (req, res) => {
    const code = parseOrThrow(roomCodeSchema, req.params.code);
    const room = rooms.get(code);
    if (!room) {
      throw new HttpError(404, "No room with that code. Check it and try again.");
    }
    res.json(toRoomInfo(room));
  });

  return router;
}

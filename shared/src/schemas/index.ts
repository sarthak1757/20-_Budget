import { z } from "zod";
import { MAX_PRICE, MAX_SLOTS, MIN_PRICE, MIN_SLOTS } from "../game/constants";

// Every payload that arrives from the outside world (sockets, admin forms,
// seed files) is checked with one of these schemas before we trust it.

export const playerNameSchema = z.string().trim().min(1).max(20);

// 6 characters, letters and digits. We upper-case first so "abc123" works too.
export const roomCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9]{6}$/, "Room code must be 6 letters or digits");

export const playerIdSchema = z.string().min(8).max(64);

export const categorySlugSchema = z
  .string()
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Slug must be lowercase words joined by dashes");

export const gameSettingsSchema = z
  .object({
    startingBudget: z.number().int().min(5).max(100),
    slotCount: z.number().int().min(MIN_SLOTS).max(MAX_SLOTS),
    turnSeconds: z.number().int().min(0).max(60),
    voteSeconds: z.number().int().min(0).max(120),
    categorySlug: categorySlugSchema,
  })
  // The budget rule needs at least $1 per slot, otherwise nobody could fill their team.
  .refine((settings) => settings.startingBudget >= settings.slotCount, {
    message: "Starting budget must be at least $1 per slot",
    path: ["startingBudget"],
  });

// ---- Socket payloads (client -> server) ----

export const roomJoinSchema = z.object({
  code: roomCodeSchema,
  playerName: playerNameSchema,
  playerId: playerIdSchema.optional(), // sent when reconnecting
});

export const turnActionSchema = z.object({
  action: z.enum(["buy", "pass"]),
  // The round the player was looking at. Lets the server ignore a stale click
  // that arrives after the round already moved on.
  roundNumber: z.number().int().min(1),
});

export const voteCastSchema = z.object({
  targetPlayerId: playerIdSchema,
});

// ---- Seed files and admin forms ----

export const seedItemSchema = z.object({
  name: z.string().trim().min(1).max(60),
  price: z.number().int().min(MIN_PRICE).max(MAX_PRICE),
  rating: z.number().int().min(1).max(100),
  tag: z.string().trim().min(1).max(30),
  emoji: z.string().min(1).max(16).optional(),
});

export const seedCategorySchema = z.object({
  slug: categorySlugSchema,
  name: z.string().trim().min(1).max(40),
  emoji: z.string().min(1).max(16),
  description: z.string().trim().min(1).max(200),
  items: z.array(seedItemSchema).min(40),
});

export type RoomJoinPayload = z.infer<typeof roomJoinSchema>;
export type TurnActionPayload = z.infer<typeof turnActionSchema>;
export type VoteCastPayload = z.infer<typeof voteCastSchema>;
export type GameSettingsPayload = z.infer<typeof gameSettingsSchema>;
export type SeedItem = z.infer<typeof seedItemSchema>;
export type SeedCategory = z.infer<typeof seedCategorySchema>;

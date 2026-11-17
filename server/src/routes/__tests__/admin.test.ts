import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../../app";
import { CategoryModel } from "../../models/Category";
import { ItemModel } from "../../models/Item";
import { RoomStore } from "../../rooms/roomStore";
import { startMemoryMongo } from "../../test/memoryMongo";

const PASSWORD = "test-admin-password";
const app = createApp({ clientUrl: "http://localhost:5173", adminPassword: PASSWORD, rooms: new RoomStore() });
let stopMongo: () => Promise<void>;

beforeAll(async () => {
  stopMongo = await startMemoryMongo();
});

afterAll(async () => {
  await stopMongo();
});

function admin() {
  return {
    get: (path: string) => request(app).get(path).set("x-admin-password", PASSWORD),
    post: (path: string, body: object) => request(app).post(path).set("x-admin-password", PASSWORD).send(body),
    put: (path: string, body: object) => request(app).put(path).set("x-admin-password", PASSWORD).send(body),
    delete: (path: string) => request(app).delete(path).set("x-admin-password", PASSWORD),
  };
}

const category = { slug: "board-games", name: "Board Games", emoji: "🎲", description: "Classic tabletop games." };
const item = { name: "Chess", price: 9, rating: 95, tag: "Strategy" };

describe("admin auth", () => {
  it("rejects a missing or wrong password", async () => {
    expect((await request(app).get("/api/admin/check")).status).toBe(401);
    const wrong = await request(app).get("/api/admin/check").set("x-admin-password", "nope");
    expect(wrong.status).toBe(401);
    expect(wrong.body).toEqual({ error: "Wrong admin password" });
    expect((await admin().get("/api/admin/check")).status).toBe(200);
  });
});

describe("admin categories and items", () => {
  it("creates, edits and deletes a category with its items", async () => {
    expect((await admin().post("/api/admin/categories", category)).status).toBe(201);
    expect((await admin().post("/api/admin/categories", category)).status).toBe(409);

    const renamed = await admin().put("/api/admin/categories/board-games", { ...category, slug: undefined, name: "Tabletop" });
    expect(renamed.status).toBe(200);
    expect(renamed.body.name).toBe("Tabletop");

    const created = await admin().post("/api/admin/categories/board-games/items", item);
    expect(created.status).toBe(201);
    const itemId: string = created.body.id;
    expect((await admin().post("/api/admin/categories/board-games/items", item)).status).toBe(409);

    const edited = await admin().put(`/api/admin/items/${itemId}`, { ...item, price: 8, emoji: "♟️" });
    expect(edited.status).toBe(200);
    expect((await ItemModel.findById(itemId).lean())?.price).toBe(8);

    // The public API sees the change straight away.
    const publicItems = await request(app).get("/api/categories/board-games/items");
    expect(publicItems.body[0]).toMatchObject({ name: "Chess", price: 8, emoji: "♟️" });

    expect((await admin().delete("/api/admin/categories/board-games")).status).toBe(204);
    expect(await ItemModel.countDocuments({ categorySlug: "board-games" })).toBe(0);
  });

  it("validates forms with the shared zod schemas", async () => {
    await admin().post("/api/admin/categories", { ...category, slug: "puzzles" });
    const badPrice = await admin().post("/api/admin/categories/puzzles/items", { ...item, price: 11 });
    expect(badPrice.status).toBe(400);
    expect(badPrice.body.error).toMatch(/price/);
    expect((await admin().post("/api/admin/categories", { ...category, slug: "Not A Slug" })).status).toBe(400);
    expect((await admin().put("/api/admin/items/not-an-id", item)).status).toBe(400);
    expect((await admin().delete("/api/admin/items/64b000000000000000000000")).status).toBe(404);
  });

  it("only accepts tags that are roles in a category with roles", async () => {
    await CategoryModel.create({ ...category, slug: "five-a-side", roles: ["Keeper", "Outfield"] });
    const wrongTag = await admin().post("/api/admin/categories/five-a-side/items", item);
    expect(wrongTag.status).toBe(400);
    expect(wrongTag.body.error).toBe("Tag must be one of: Keeper, Outfield");

    const created = await admin().post("/api/admin/categories/five-a-side/items", { ...item, tag: "Keeper" });
    expect(created.status).toBe(201);
    const edit = await admin().put(`/api/admin/items/${created.body.id}`, { ...item, tag: "Goalie" });
    expect(edit.status).toBe(400);

    // Renaming the category keeps its roles.
    await admin().put("/api/admin/categories/five-a-side", { name: "5-a-side", emoji: "⚽", description: "Small games." });
    expect((await CategoryModel.findOne({ slug: "five-a-side" }).lean())?.roles).toEqual(["Keeper", "Outfield"]);
  });
});

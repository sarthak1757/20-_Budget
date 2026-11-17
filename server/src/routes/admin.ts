import { Router } from "express";
import { isValidObjectId } from "mongoose";
import {
  adminCategorySchema,
  adminCategoryUpdateSchema,
  adminItemSchema,
  categorySlugSchema,
} from "@budget-draft/shared";
import { HttpError } from "../middleware/errorHandler";
import { requireAdmin } from "../middleware/requireAdmin";
import { parseOrThrow } from "../middleware/validate";
import { CategoryModel } from "../models/Category";
import { ItemModel } from "../models/Item";
import { getCategoryItems, listCategories } from "../services/catalog";

// MongoDB reports a broken unique index (e.g. a repeated item name) with code 11000.
function isDuplicateKeyError(error: unknown): boolean {
  return typeof error === "object" && error !== null && (error as { code?: unknown }).code === 11000;
}

function parseItemId(value: unknown): string {
  if (typeof value !== "string" || !isValidObjectId(value)) {
    throw new HttpError(400, "Invalid item id");
  }
  return value;
}

export function adminRouter(adminPassword: string): Router {
  const router = Router();
  router.use(requireAdmin(adminPassword));

  // Lets the admin page check a password before showing anything.
  router.get("/check", (_req, res) => {
    res.json({ ok: true });
  });

  // ---- Categories ----

  router.get("/categories", async (_req, res) => {
    res.json(await listCategories());
  });

  router.post("/categories", async (req, res) => {
    const body = parseOrThrow(adminCategorySchema, req.body);
    try {
      await CategoryModel.create(body);
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        throw new HttpError(409, `A category with slug "${body.slug}" already exists`);
      }
      throw error;
    }
    res.status(201).json(body);
  });

  // The slug can't change: items and saved games refer to it.
  router.put("/categories/:slug", async (req, res) => {
    const slug = parseOrThrow(categorySlugSchema, req.params.slug);
    const body = parseOrThrow(adminCategoryUpdateSchema, req.body);
    const updated = await CategoryModel.findOneAndUpdate({ slug }, body, { returnDocument: "after" }).lean();
    if (!updated) {
      throw new HttpError(404, "Category not found");
    }
    res.json({ slug, ...body });
  });

  // Deleting a category also deletes its items. Past game results keep their snapshots.
  router.delete("/categories/:slug", async (req, res) => {
    const slug = parseOrThrow(categorySlugSchema, req.params.slug);
    const deleted = await CategoryModel.findOneAndDelete({ slug });
    if (!deleted) {
      throw new HttpError(404, "Category not found");
    }
    await ItemModel.deleteMany({ categorySlug: slug });
    res.status(204).end();
  });

  // ---- Items ----

  router.get("/categories/:slug/items", async (req, res) => {
    const slug = parseOrThrow(categorySlugSchema, req.params.slug);
    const items = await getCategoryItems(slug);
    if (items === null) {
      throw new HttpError(404, "Category not found");
    }
    res.json(items);
  });

  router.post("/categories/:slug/items", async (req, res) => {
    const slug = parseOrThrow(categorySlugSchema, req.params.slug);
    const body = parseOrThrow(adminItemSchema, req.body);
    if (!(await CategoryModel.exists({ slug }))) {
      throw new HttpError(404, "Category not found");
    }
    try {
      const created = await ItemModel.create({ ...body, categorySlug: slug });
      res.status(201).json({ id: String(created._id), ...body, category: slug });
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        throw new HttpError(409, `"${body.name}" is already in this category`);
      }
      throw error;
    }
  });

  router.put("/items/:id", async (req, res) => {
    const id = parseItemId(req.params.id);
    const body = parseOrThrow(adminItemSchema, req.body);
    // $unset removes the emoji when the form leaves it empty.
    const update = body.emoji === undefined ? { ...body, $unset: { emoji: 1 } } : body;
    try {
      const updated = await ItemModel.findByIdAndUpdate(id, update, { returnDocument: "after", runValidators: true }).lean();
      if (!updated) {
        throw new HttpError(404, "Item not found");
      }
      res.json({ id, ...body, category: updated.categorySlug });
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        throw new HttpError(409, `"${body.name}" is already in this category`);
      }
      throw error;
    }
  });

  router.delete("/items/:id", async (req, res) => {
    const id = parseItemId(req.params.id);
    const deleted = await ItemModel.findByIdAndDelete(id);
    if (!deleted) {
      throw new HttpError(404, "Item not found");
    }
    res.status(204).end();
  });

  return router;
}

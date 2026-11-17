import { Router } from "express";
import { categorySlugSchema } from "@budget-draft/shared";
import { HttpError } from "../middleware/errorHandler";
import { parseOrThrow } from "../middleware/validate";
import { getCategoryItems, listCategories } from "../services/catalog";

export function categoriesRouter(): Router {
  const router = Router();

  router.get("/", async (_req, res) => {
    res.json(await listCategories());
  });

  router.get("/:slug/items", async (req, res) => {
    const slug = parseOrThrow(categorySlugSchema, req.params.slug);
    const items = await getCategoryItems(slug);
    if (items === null) {
      throw new HttpError(404, `Category "${slug}" not found`);
    }
    res.json(items);
  });

  return router;
}

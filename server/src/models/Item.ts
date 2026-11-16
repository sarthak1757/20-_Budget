import { Schema, model } from "mongoose";
import { MAX_PRICE, MIN_PRICE } from "@budget-draft/shared";

export interface ItemDoc {
  name: string;
  categorySlug: string;
  price: number;
  rating: number;
  tag: string;
  emoji?: string;
  createdAt: Date;
  updatedAt: Date;
}

const itemSchema = new Schema<ItemDoc>(
  {
    name: { type: String, required: true, trim: true },
    // We link items to categories by slug rather than ObjectId: it keeps seed
    // files readable and means the game never needs a join to know the category.
    categorySlug: { type: String, required: true, index: true },
    price: { type: Number, required: true, min: MIN_PRICE, max: MAX_PRICE },
    rating: { type: Number, required: true, min: 1, max: 100 },
    tag: { type: String, required: true, trim: true },
    emoji: { type: String },
  },
  { timestamps: true },
);

// The same name can't appear twice in one category (it would confuse players).
itemSchema.index({ categorySlug: 1, name: 1 }, { unique: true });

export const ItemModel = model<ItemDoc>("Item", itemSchema);

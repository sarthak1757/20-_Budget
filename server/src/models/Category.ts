import { Schema, model } from "mongoose";

export interface CategoryDoc {
  slug: string;
  name: string;
  emoji: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<CategoryDoc>(
  {
    // The slug is the public id (used in URLs and by items), so it must be unique.
    slug: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    emoji: { type: String, required: true },
    description: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);

export const CategoryModel = model<CategoryDoc>("Category", categorySchema);

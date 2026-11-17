import { describe, expect, it } from "vitest";
import { adminItemSchema } from "@budget-draft/shared";
import { validateForm } from "./formErrors";

describe("validateForm", () => {
  it("returns parsed data for valid values", () => {
    const result = validateForm(adminItemSchema, { name: " Chess ", price: 9, rating: 95, tag: "Strategy" });
    expect(result).toEqual({ ok: true, data: { name: "Chess", price: 9, rating: 95, tag: "Strategy" } });
  });

  it("returns one message per bad field", () => {
    const result = validateForm(adminItemSchema, { name: "", price: 11, rating: 0, tag: "T" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(Object.keys(result.errors).sort()).toEqual(["name", "price", "rating"]);
    }
  });
});

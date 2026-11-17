import { describe, expect, it } from "vitest";
import { parseCustomItems } from "../customCategory";

// n valid lines: "Item 1, 3, 70, Snack" and so on.
function lines(count: number): string[] {
  const result: string[] = [];
  for (let i = 1; i <= count; i++) {
    result.push(`Item ${i}, ${(i % 10) + 1}, ${50 + (i % 50)}, Snack`);
  }
  return result;
}

describe("parseCustomItems", () => {
  it("reads comma lines, skipping blanks, comments and a header", () => {
    const text = ["name, price, rating, tag", "# my list", "", ...lines(20)].join("\n");
    const result = parseCustomItems(text);
    if (!result.ok) throw new Error(result.errors.join("; "));
    expect(result.items).toHaveLength(20);
    expect(result.items[0]).toEqual({ name: "Item 1", price: 2, rating: 51, tag: "Snack" });
  });

  it("keeps commas inside the name and accepts a $ on the price", () => {
    const text = ["Fish, chips and peas, $3, 70, Classic", ...lines(19)].join("\n");
    const result = parseCustomItems(text);
    if (!result.ok) throw new Error(result.errors.join("; "));
    expect(result.items[0]).toEqual({ name: "Fish, chips and peas", price: 3, rating: 70, tag: "Classic" });
  });

  it("reads tab-separated lines (pasted from a spreadsheet), commas in the name included", () => {
    const tabbed = lines(19).map((line) => line.split(", ").join("\t"));
    const result = parseCustomItems(["Name\tPrice\tRating\tTag", "Salt, vinegar crisps\t2\t60\tSnack", ...tabbed].join("\n"));
    if (!result.ok) throw new Error(result.errors.join("; "));
    expect(result.items).toHaveLength(20);
    expect(result.items[0]?.name).toBe("Salt, vinegar crisps");
  });

  it("reports every bad line with its line number", () => {
    const text = [...lines(20), "Too few, 3, 70", "Pricey, 11, 70, Snack", "Bad rating, 3, great, Snack", "Item 4, 3, 70, Snack"].join(
      "\n",
    );
    const result = parseCustomItems(text);
    expect(result).toEqual({
      ok: false,
      errors: [
        'Line 21: expected "name, price, rating, tag"',
        "Line 22: the price must be a whole number from $1 to $10",
        "Line 23: the rating must be a whole number from 1 to 100",
        'Line 24: "Item 4" is already on line 4',
      ],
    });
  });

  it("needs 20 to 150 items", () => {
    expect(parseCustomItems(lines(19).join("\n"))).toEqual({ ok: false, errors: ["Add at least 20 items (you have 19)"] });
    expect(parseCustomItems(lines(151).join("\n"))).toEqual({ ok: false, errors: ["At most 150 items (you have 151)"] });
    expect(parseCustomItems(lines(150).join("\n")).ok).toBe(true);
  });
});

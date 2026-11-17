import { customItemsSchema, seedItemSchema, type CustomItem } from "../schemas";
import { CUSTOM_MAX_ITEMS, CUSTOM_MIN_ITEMS } from "./constants";

// Turns the text a host pastes into a list of items. One item per line:
//
//   name, price, rating, tag        (or the same separated by tabs)
//   Pizza Margherita, 4, 78, Pizza
//
// The name may contain commas ("Fish, chips and peas, 3, 70, Classic"), so the
// line is read from the RIGHT: the last three fields are price, rating and tag
// and everything before them is the name. Blank lines and lines starting with
// # are skipped, and so is a "name, price, rating, tag" header row.

export type CustomParseResult = { ok: true; items: CustomItem[] } | { ok: false; errors: string[] };

const FIELD_HELP: Record<string, string> = {
  name: "the name must be 1–60 characters",
  price: "the price must be a whole number from $1 to $10",
  rating: "the rating must be a whole number from 1 to 100",
  tag: "the tag must be 1–30 characters",
};

export function parseCustomItems(text: string): CustomParseResult {
  const items: CustomItem[] = [];
  const errors: string[] = [];
  const lineOfName = new Map<string, number>(); // lower-case name -> line it first appeared on

  const lines = text.split(/\r?\n/);
  for (let index = 0; index < lines.length; index++) {
    const lineNumber = index + 1;
    const line = (lines[index] ?? "").trim();
    if (line === "" || line.startsWith("#") || isHeaderRow(line)) {
      continue;
    }

    const separator = line.includes("\t") ? "\t" : ",";
    const parts = line.split(separator);
    if (parts.length < 4) {
      errors.push(`Line ${lineNumber}: expected "name, price, rating, tag"`);
      continue;
    }
    const tag = parts[parts.length - 1] ?? "";
    const rating = parts[parts.length - 2] ?? "";
    const price = parts[parts.length - 3] ?? "";
    const name = parts.slice(0, parts.length - 3).join(separator);

    const parsed = seedItemSchema.safeParse({
      name,
      price: toNumber(price.replace("$", "")),
      rating: toNumber(rating),
      tag,
    });
    if (!parsed.success) {
      const field = String(parsed.error.issues[0]?.path[0] ?? "");
      errors.push(`Line ${lineNumber}: ${FIELD_HELP[field] ?? "this line isn't valid"}`);
      continue;
    }

    const key = parsed.data.name.toLowerCase();
    const firstLine = lineOfName.get(key);
    if (firstLine !== undefined) {
      errors.push(`Line ${lineNumber}: "${parsed.data.name}" is already on line ${firstLine}`);
      continue;
    }
    lineOfName.set(key, lineNumber);
    items.push({ name: parsed.data.name, price: parsed.data.price, rating: parsed.data.rating, tag: parsed.data.tag });
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }
  if (items.length < CUSTOM_MIN_ITEMS) {
    return { ok: false, errors: [`Add at least ${CUSTOM_MIN_ITEMS} items (you have ${items.length})`] };
  }
  if (items.length > CUSTOM_MAX_ITEMS) {
    return { ok: false, errors: [`At most ${CUSTOM_MAX_ITEMS} items (you have ${items.length})`] };
  }
  // Same checks the server runs, so the two can't disagree.
  const checked = customItemsSchema.safeParse(items);
  if (!checked.success) {
    return { ok: false, errors: [checked.error.issues[0]?.message ?? "The list isn't valid"] };
  }
  return { ok: true, items: checked.data };
}

// "" and "abc" become NaN, which zod rejects with a clear message.
function toNumber(text: string): number {
  const trimmed = text.trim();
  return trimmed === "" ? Number.NaN : Number(trimmed);
}

// Treats tabs as commas and ignores spaces, so "Name, Price, Rating, Tag" matches.
function isHeaderRow(line: string): boolean {
  const normalised = line.toLowerCase().replaceAll("\t", ",").replaceAll(" ", "");
  return normalised === "name,price,rating,tag";
}

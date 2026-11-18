import { CUSTOM_MAX_ITEMS, CUSTOM_MIN_ITEMS } from "@budget-draft/shared";
import { Label, UrgentNote } from "./brand/primitives";
import { Card } from "./ui";

const EXAMPLE = `Pizza Margherita, 4, 78, Pizza
Fish, chips and peas, 3, 70, Classic
Ramen, 5, 85, Noodles`;

// Most errors shown at once; the rest are summed up so the page stays short.
const MAX_ERRORS_SHOWN = 8;

interface CustomListFieldProps {
  value: string;
  onChange: (value: string) => void;
  errors: string[];
}

// The textarea for a custom category, with the format and any line errors.
export function CustomListField({ value, onChange, errors }: CustomListFieldProps) {
  let lineCount = 0;
  for (const line of value.split("\n")) {
    if (line.trim() !== "" && !line.trim().startsWith("#")) {
      lineCount += 1;
    }
  }
  const shown = errors.slice(0, MAX_ERRORS_SHOWN);
  const hidden = errors.length - shown.length;

  return (
    <Card className="grid gap-3">
      <label htmlFor="custom-list">
        <Label className="text-ivory">Your items</Label>
      </label>
      <p className="text-sm text-mist">
        One per line: <span className="font-mono text-ivory">name, price, rating, tag</span>. Price $1–$10, rating 1–100.
        {` ${CUSTOM_MIN_ITEMS}–${CUSTOM_MAX_ITEMS}`} items. You can paste straight from a spreadsheet.
      </p>
      <textarea
        id="custom-list"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={10}
        spellCheck={false}
        placeholder={EXAMPLE}
        className="rounded-2xl border border-mist/40 bg-transparent px-3 py-2 font-mono text-sm text-ivory outline-none placeholder:text-mist/50 focus:border-ivory"
      />
      <p className="text-right"><Label className="text-mist/80">{lineCount} lines</Label></p>
      {shown.length > 0 && (
        <ul role="alert" className="grid gap-2">
          {shown.map((message) => (
            <li key={message}>
              <UrgentNote>{message}</UrgentNote>
            </li>
          ))}
          {hidden > 0 && <li className="text-sm text-mist">…and {hidden} more</li>}
        </ul>
      )}
    </Card>
  );
}

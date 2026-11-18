import type { BotDifficulty } from "@budget-draft/shared";
import { Label } from "./brand/primitives";

const LEVELS: { value: BotDifficulty; label: string; description: string }[] = [
  { value: "easy", label: "Easy", description: "Grabs good value. Never pays for stars." },
  { value: "medium", label: "Medium", description: "Waits for above-average items and pays for stars." },
  { value: "hard", label: "Hard", description: "Plans its whole budget and bids to the limit." },
];

interface DifficultyPickerProps {
  value: BotDifficulty;
  onChange: (difficulty: BotDifficulty) => void;
}

export function DifficultyPicker({ value, onChange }: DifficultyPickerProps) {
  const selected = LEVELS.find((level) => level.value === value);
  return (
    <fieldset className="grid gap-3">
      <legend className="mb-3">
        <Label>Bot difficulty</Label>
      </legend>
      <div className="grid grid-cols-3 gap-2">
        {LEVELS.map((level) => (
          <button
            key={level.value}
            type="button"
            aria-pressed={level.value === value}
            onClick={() => onChange(level.value)}
            className={`display-serif rounded-[1.25rem] py-3 text-2xl text-ivory transition ${level.value === value ? "bg-ink shadow-glow" : "ring-1 ring-mist/15 hover:bg-ink-hover"}`}
          >
            {level.label}
          </button>
        ))}
      </div>
      <p className="text-sm text-mist">{selected ? selected.description : ""}</p>
    </fieldset>
  );
}

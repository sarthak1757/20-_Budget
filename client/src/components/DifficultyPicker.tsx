import type { BotDifficulty } from "@budget-draft/shared";

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
    <fieldset className="grid gap-2">
      <legend className="mb-2 text-zinc-300">Bot difficulty</legend>
      <div className="grid grid-cols-3 gap-2">
        {LEVELS.map((level) => (
          <button
            key={level.value}
            type="button"
            aria-pressed={level.value === value}
            onClick={() => onChange(level.value)}
            className={`rounded-xl border-2 py-2 font-bold transition ${level.value === value ? "border-emerald-400 bg-emerald-950/40" : "border-zinc-800 bg-zinc-950"}`}
          >
            {level.label}
          </button>
        ))}
      </div>
      <p className="text-sm text-zinc-500">{selected ? selected.description : ""}</p>
    </fieldset>
  );
}

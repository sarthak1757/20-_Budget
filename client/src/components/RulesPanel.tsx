import type { DraftStyle, GameSettings } from "@budget-draft/shared";

interface RulesPanelProps {
  settings: GameSettings;
  disabled?: boolean;
  onChange: (settings: GameSettings) => void;
}

const DRAFT_STYLES: { value: DraftStyle; label: string; description: string }[] = [
  { value: "classic", label: "Classic", description: "Buy or pass at the listed price." },
  { value: "auction", label: "Auction", description: "Bid against each other. Highest bid wins." },
];

// Draft style and optional extras. Used by the local setup page and the online lobby.
export function RulesPanel({ settings, disabled = false, onChange }: RulesPanelProps) {
  return (
    <div className="grid gap-3">
      <fieldset className="grid gap-2" disabled={disabled}>
        <legend className="mb-2 text-zinc-300">Draft style</legend>
        <div className="grid grid-cols-2 gap-2">
          {DRAFT_STYLES.map((style) => {
            const selected = settings.draftStyle === style.value;
            return (
              <button
                key={style.value}
                type="button"
                aria-pressed={selected}
                onClick={() => onChange({ ...settings, draftStyle: style.value })}
                className={`rounded-xl border-2 p-3 text-left transition disabled:opacity-60 ${selected ? "border-emerald-400 bg-emerald-950/40" : "border-zinc-800 bg-zinc-950"}`}
              >
                <span className="block font-bold">{style.label}</span>
                <span className="block text-xs text-zinc-400">{style.description}</span>
              </button>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}

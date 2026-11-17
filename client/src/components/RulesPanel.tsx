import { BALANCED_TEAM_BONUS, type DraftStyle, type GameSettings } from "@budget-draft/shared";
import { Toggle } from "./Toggle";

interface RulesPanelProps {
  settings: GameSettings;
  categoryRoles: string[]; // empty when the category has no roles
  disabled?: boolean;
  onChange: (settings: GameSettings) => void;
}

const DRAFT_STYLES: { value: DraftStyle; label: string; description: string }[] = [
  { value: "classic", label: "Classic", description: "Buy or pass at the listed price." },
  { value: "auction", label: "Auction", description: "Bid against each other. Highest bid wins." },
];

// Why Balanced team can't be switched on, or null if it can.
function balancedTeamProblem(categoryRoles: string[], slotCount: number): string | null {
  if (categoryRoles.length === 0) {
    return "This category has no roles.";
  }
  if (categoryRoles.length > slotCount) {
    return `Needs at least ${categoryRoles.length} slots.`;
  }
  return null;
}

// Draft style and optional extras. Used by the local setup page and the online lobby.
export function RulesPanel({ settings, categoryRoles, disabled = false, onChange }: RulesPanelProps) {
  const rolesProblem = balancedTeamProblem(categoryRoles, settings.slotCount);
  let balancedDescription = `+${BALANCED_TEAM_BONUS} points for a team with every role: ${categoryRoles.join(", ")}.`;
  if (rolesProblem !== null) {
    balancedDescription = rolesProblem;
  }

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

      <div className="grid gap-3">
        <p className="text-zinc-300">Extras</p>
        <Toggle
          label="Balanced team"
          description={balancedDescription}
          // Shown as off when it can't apply, so nobody expects a bonus that won't come.
          checked={settings.balancedTeam && rolesProblem === null}
          disabled={disabled || rolesProblem !== null}
          onChange={(checked) => onChange({ ...settings, balancedTeam: checked })}
        />
      </div>
    </div>
  );
}

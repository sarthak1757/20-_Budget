import { applyPreset, BALANCED_TEAM_BONUS, getRulesPreset, type DraftStyle, type GameSettings } from "@budget-draft/shared";
import { Label } from "./brand/primitives";
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
  const preset = getRulesPreset(settings, rolesProblem === null);

  return (
    <div className="grid gap-6">
      <fieldset className="grid gap-3" disabled={disabled}>
        <legend className="mb-3">
          <Label>Draft style</Label>
        </legend>
        <div className="grid grid-cols-2 gap-2">
          {DRAFT_STYLES.map((style) => {
            const selected = settings.draftStyle === style.value;
            return (
              <button
                key={style.value}
                type="button"
                aria-pressed={selected}
                onClick={() => onChange({ ...settings, draftStyle: style.value })}
                className={`rounded-[1.25rem] p-4 text-left transition disabled:opacity-60 ${selected ? "bg-mocha shadow-glow" : "ring-1 ring-platinum/30 hover:bg-mocha-light"}`}
              >
                <span className="display-italic block text-3xl text-lavender">{style.label}</span>
                <span className="mt-1 block text-sm text-platinum">{style.description}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="grid gap-5">
        <div className="flex items-center justify-between gap-2">
          <Label>Extras</Label>
          <div className="flex gap-2" role="group" aria-label="Presets">
            <PresetButton
              label="Classic"
              active={preset === "classic"}
              disabled={disabled}
              onClick={() => onChange(applyPreset(settings, "classic"))}
            />
            <PresetButton
              label="Chaos"
              active={preset === "chaos"}
              disabled={disabled}
              onClick={() => onChange(applyPreset(settings, "chaos"))}
            />
          </div>
        </div>
        <Toggle
          label="Balanced team"
          description={balancedDescription}
          // Shown as off when it can't apply, so nobody expects a bonus that won't come.
          checked={settings.balancedTeam && rolesProblem === null}
          disabled={disabled || rolesProblem !== null}
          onChange={(checked) => onChange({ ...settings, balancedTeam: checked })}
        />
        <Toggle
          label="Mystery items"
          description="About 1 in 6 items hide their rating until the draft ends. Only the price and tag are shown."
          checked={settings.mysteryItems}
          disabled={disabled}
          onChange={(checked) => onChange({ ...settings, mysteryItems: checked })}
        />
        <Toggle
          label="Power-ups"
          description="Everyone gets Veto, Discount (Classic only) and Peek, once each per game."
          checked={settings.powerUps}
          disabled={disabled}
          onChange={(checked) => onChange({ ...settings, powerUps: checked })}
        />
      </div>
    </div>
  );
}

function PresetButton({ label, active, disabled, onClick }: { label: string; active: boolean; disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={`label-caps rounded-full px-3 py-1.5 ring-1 transition disabled:opacity-60 ${active ? "bg-lavender text-mocha ring-lavender" : "text-platinum ring-platinum/50 hover:bg-mocha-light"}`}
    >
      {label}
    </button>
  );
}

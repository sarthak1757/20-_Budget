import {
  BID_SECONDS_OPTIONS,
  TURN_SECONDS_OPTIONS,
  VOTE_SECONDS_OPTIONS,
  type GameSettings,
} from "@budget-draft/shared";
import { Label } from "./brand/primitives";

interface TimerSettingsProps {
  settings: GameSettings;
  isHost: boolean;
  disabled: boolean;
  showVote: boolean; // only when there will be a vote (3+ players)
  onChange: (settings: GameSettings) => void;
}

// The online lobby's timers. The host picks presets; everyone else sees the
// choice as plain text. Only the timer for the chosen draft style is shown.
export function TimerSettings({ settings, isHost, disabled, showVote, onChange }: TimerSettingsProps) {
  const isAuction = settings.draftStyle === "auction";

  if (!isHost) {
    return (
      <div className="grid gap-1">
        <Label>Timers</Label>
        <p className="text-ivory">
          ⏱ {isAuction ? `${settings.bidSeconds}s per bid` : `${settings.turnSeconds}s per turn`}
        </p>
        {showVote && <p className="text-ivory">⏱ {settings.voteSeconds}s to vote</p>}
        <p className="text-sm text-mist">If time runs out, you pass.</p>
      </div>
    );
  }

  return (
    <fieldset className="grid gap-4" disabled={disabled}>
      <legend className="mb-3">
        <Label>Timers</Label>
      </legend>
      {isAuction ? (
        <SecondsPicker
          label="Per bid"
          options={BID_SECONDS_OPTIONS}
          value={settings.bidSeconds}
          onPick={(bidSeconds) => onChange({ ...settings, bidSeconds })}
        />
      ) : (
        <SecondsPicker
          label="Per turn"
          options={TURN_SECONDS_OPTIONS}
          value={settings.turnSeconds}
          onPick={(turnSeconds) => onChange({ ...settings, turnSeconds })}
        />
      )}
      {showVote && (
        <SecondsPicker
          label="To vote"
          options={VOTE_SECONDS_OPTIONS}
          value={settings.voteSeconds}
          onPick={(voteSeconds) => onChange({ ...settings, voteSeconds })}
        />
      )}
      <p className="text-sm text-mist">If time runs out, you pass.</p>
    </fieldset>
  );
}

interface SecondsPickerProps {
  label: string;
  options: readonly number[];
  value: number;
  onPick: (seconds: number) => void;
}

// One row of segmented buttons. Equal columns, so 6 presets still fit a 360px phone.
function SecondsPicker({ label, options, value, onPick }: SecondsPickerProps) {
  return (
    <div className="grid gap-2">
      <Label className="text-mist/80">{label}</Label>
      <div
        role="group"
        aria-label={`Seconds ${label.toLowerCase()}`}
        className="grid gap-1 rounded-full p-1 ring-1 ring-mist/15"
        style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
      >
        {options.map((seconds) => {
          const selected = seconds === value;
          return (
            <button
              key={seconds}
              type="button"
              aria-pressed={selected}
              aria-label={`${seconds} seconds`}
              onClick={() => onPick(seconds)}
              className={`min-h-11 min-w-11 rounded-full text-base tabular-nums transition disabled:opacity-60 ${selected ? "bg-gold text-ink" : "text-ivory hover:bg-ink-hover"}`}
            >
              {seconds}s
            </button>
          );
        })}
      </div>
    </div>
  );
}

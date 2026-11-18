import { Label } from "./brand/primitives";

interface ToggleProps {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}

// An on/off switch with a short explanation underneath.
export function Toggle({ label, description, checked, disabled = false, onChange }: ToggleProps) {
  return (
    <label className={`flex items-start justify-between gap-6 ${disabled ? "opacity-50" : "cursor-pointer"}`}>
      <span className="min-w-0">
        <Label className="text-lavender">{label}</Label>
        <span className="mt-1 block text-sm text-platinum">{description}</span>
      </span>
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden
        className={`relative mt-0.5 h-7 w-12 shrink-0 rounded-full ring-1 transition peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-lavender-deep ${checked ? "bg-lavender ring-lavender" : "ring-platinum/60"}`}
      >
        <span
          className={`absolute top-1 size-5 rounded-full transition-all ${checked ? "left-6 bg-mocha-dark" : "left-1 bg-platinum"}`}
        />
      </span>
    </label>
  );
}

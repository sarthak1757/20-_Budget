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
    <label className={`flex items-start gap-3 ${disabled ? "opacity-50" : "cursor-pointer"}`}>
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
        className={`mt-0.5 flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition peer-focus-visible:ring-2 peer-focus-visible:ring-emerald-400 ${checked ? "bg-emerald-500" : "bg-zinc-700"}`}
      >
        <span className={`size-5 rounded-full bg-white transition ${checked ? "translate-x-5" : ""}`} />
      </span>
      <span className="min-w-0">
        <span className="block text-zinc-200">{label}</span>
        <span className="block text-xs text-zinc-500">{description}</span>
      </span>
    </label>
  );
}

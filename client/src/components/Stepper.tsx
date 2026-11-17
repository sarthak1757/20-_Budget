interface StepperProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  format?: (value: number) => string;
  onChange: (value: number) => void;
  disabled?: boolean;
}

// A − value + control. Easier to use on a phone than a number input.
export function Stepper({ label, value, min, max, step = 1, format, onChange, disabled = false }: StepperProps) {
  const shown = format ? format(value) : String(value);
  const buttonClass =
    "size-11 rounded-xl bg-zinc-800 text-xl font-bold hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-zinc-300">{label}</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className={buttonClass}
          aria-label={`Decrease ${label}`}
          disabled={disabled || value - step < min}
          onClick={() => onChange(value - step)}
        >
          −
        </button>
        <span className="w-14 text-center text-xl font-bold tabular-nums" aria-live="polite">
          {shown}
        </span>
        <button
          type="button"
          className={buttonClass}
          aria-label={`Increase ${label}`}
          disabled={disabled || value + step > max}
          onClick={() => onChange(value + step)}
        >
          +
        </button>
      </div>
    </div>
  );
}

import { Label } from "./brand/primitives";

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
    "grid size-11 place-items-center rounded-full text-xl text-platinum ring-1 ring-platinum/60 transition hover:bg-mocha-light disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <div className="flex items-center justify-between gap-4">
      <Label>{label}</Label>
      <div className="flex items-center gap-3">
        <button
          type="button"
          className={buttonClass}
          aria-label={`Decrease ${label}`}
          disabled={disabled || value - step < min}
          onClick={() => onChange(value - step)}
        >
          −
        </button>
        <span className="display-italic w-16 text-center text-4xl text-lavender tabular-nums" aria-live="polite">
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

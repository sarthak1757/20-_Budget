import { INPUT_CLASS, Label, UrgentNote } from "../brand/primitives";

interface FieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string | undefined;
  type?: "text" | "number";
  disabled?: boolean;
  placeholder?: string;
}

// A labelled underline input that shows its validation message underneath.
export function Field({ label, value, onChange, error, type = "text", disabled = false, placeholder }: FieldProps) {
  return (
    <label className="grid min-w-0 gap-1.5">
      <Label>{label}</Label>
      <input
        type={type}
        inputMode={type === "number" ? "numeric" : undefined}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error !== undefined}
        className={`${INPUT_CLASS} min-w-0 py-1.5 text-base ${error ? "border-gold" : ""}`}
      />
      {error && <UrgentNote>{error}</UrgentNote>}
    </label>
  );
}

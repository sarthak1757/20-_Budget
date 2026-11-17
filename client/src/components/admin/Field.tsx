interface FieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string | undefined;
  type?: "text" | "number";
  disabled?: boolean;
  placeholder?: string;
}

// A labelled input that shows its validation message underneath.
export function Field({ label, value, onChange, error, type = "text", disabled = false, placeholder }: FieldProps) {
  return (
    <label className="grid gap-1">
      <span className="text-sm text-zinc-400">{label}</span>
      <input
        type={type}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error !== undefined}
        className={`rounded-lg border bg-zinc-950 px-3 py-2 outline-none focus:border-emerald-500 disabled:opacity-50 ${error ? "border-rose-500" : "border-zinc-700"}`}
      />
      {error && <span className="text-sm text-rose-400">{error}</span>}
    </label>
  );
}

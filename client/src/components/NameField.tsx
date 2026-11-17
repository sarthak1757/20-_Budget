interface NameFieldProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

export function NameField({ value, onChange, label = "Your name" }: NameFieldProps) {
  return (
    <label className="grid gap-1">
      <span className="text-sm text-zinc-400">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        maxLength={20}
        autoComplete="nickname"
        className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-3 outline-none focus:border-emerald-500"
      />
    </label>
  );
}

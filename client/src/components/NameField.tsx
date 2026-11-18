import { INPUT_CLASS, Label } from "./brand/primitives";

interface NameFieldProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

export function NameField({ value, onChange, label = "Your name" }: NameFieldProps) {
  return (
    <label className="grid gap-2">
      <Label>{label}</Label>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        maxLength={20}
        autoComplete="nickname"
        className={INPUT_CLASS}
      />
    </label>
  );
}

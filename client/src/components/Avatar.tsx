// A coloured circle with an emoji or the name's initials.
// We never use real photos or logos, so this is how items and players get a face.

const COLORS = [
  "bg-sky-600",
  "bg-violet-600",
  "bg-amber-600",
  "bg-rose-600",
  "bg-teal-600",
  "bg-indigo-600",
  "bg-lime-700",
  "bg-fuchsia-700",
];

export function getInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  const first = words[0]?.[0] ?? "?";
  const last = words.length > 1 ? (words[words.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase();
}

// The same name always gets the same colour.
function colorFor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) % 1_000_003;
  }
  return COLORS[hash % COLORS.length] ?? "bg-zinc-600";
}

const SIZES = {
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-20 text-3xl",
};

export function Avatar({ name, emoji, size = "md" }: { name: string; emoji?: string | undefined; size?: keyof typeof SIZES }) {
  const base = `inline-flex shrink-0 items-center justify-center rounded-full font-bold ${SIZES[size]}`;
  if (emoji) {
    return (
      <span className={`${base} bg-zinc-800`} aria-hidden>
        {emoji}
      </span>
    );
  }
  return (
    <span className={`${base} ${colorFor(name)} text-white`} aria-hidden>
      {getInitials(name)}
    </span>
  );
}

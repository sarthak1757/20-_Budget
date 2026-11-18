// A hairline circle with an emoji or the name's initials in serif.
// We never use real photos or logos, so this is how items and players get a face.

export function getInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  const first = words[0]?.[0] ?? "?";
  const last = words.length > 1 ? (words[words.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase();
}

const SIZES = {
  sm: "size-8 text-sm",
  md: "size-10 text-lg",
  lg: "size-20 text-4xl",
};

export function Avatar({ name, emoji, size = "md" }: { name: string; emoji?: string | undefined; size?: keyof typeof SIZES }) {
  const base = `inline-grid shrink-0 place-items-center rounded-full ring-1 ring-mist/60 text-ivory ${SIZES[size]}`;
  if (emoji) {
    return (
      <span className={base} aria-hidden>
        {emoji}
      </span>
    );
  }
  return (
    <span className={`${base} display-serif`} aria-hidden>
      {getInitials(name)}
    </span>
  );
}

import type { ButtonHTMLAttributes, ReactNode, Ref } from "react";
import { Link } from "react-router";

// The building blocks of the editorial theme. Every colour is a theme token
// (mocha, lavender, platinum, ...): no raw hex here or in any component.

// ---- Text ----

// Tiny uppercase letter-spaced label ("SLOT 1", "ROOM CODE", prices, timer).
export function Label({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <span className={`label-caps text-platinum ${className}`}>{children}</span>;
}

// Small vertical label running up the side of a section, used sparingly.
export function SideLabel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span aria-hidden className={`label-caps side-label text-platinum/70 ${className}`}>
      {children}
    </span>
  );
}

// A 1px platinum line at 30% opacity.
export function Hairline({ className = "" }: { className?: string }) {
  return <hr className={`h-px border-0 bg-platinum/30 ${className}`} />;
}

// ---- Buttons and links ----

export type PillVariant = "primary" | "secondary" | "ghost";

const PILL_CLASSES: Record<PillVariant, string> = {
  // lavender fill + mocha text (5.77:1), platinum on hover (5.86:1).
  primary:
    "bg-lavender text-mocha hover:bg-platinum disabled:bg-transparent disabled:text-platinum/50 disabled:ring-1 disabled:ring-platinum/30",
  // 1px platinum outline.
  secondary: "ring-1 ring-platinum text-platinum hover:bg-mocha-light disabled:text-platinum/40 disabled:ring-platinum/30",
  ghost: "text-platinum hover:bg-mocha-light disabled:text-platinum/40",
};

interface PillButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: PillVariant;
  ref?: Ref<HTMLButtonElement>;
}

export function PillButton({ variant = "primary", className = "", ...rest }: PillButtonProps) {
  const classes = `inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 font-body font-medium transition active:scale-[0.98] disabled:cursor-not-allowed disabled:active:scale-100 ${PILL_CLASSES[variant]} ${className}`;
  return <button type="button" className={classes} {...rest} />;
}

// "→ EXPLORE": an arrow in a thin circle next to a small uppercase label.
function ArrowContent({ children }: { children: ReactNode }) {
  return (
    <>
      <span
        aria-hidden
        className="grid size-8 place-items-center rounded-full ring-1 ring-platinum/60 transition group-hover:bg-lavender group-hover:text-mocha group-hover:ring-lavender"
      >
        →
      </span>
      <span className="label-caps">{children}</span>
    </>
  );
}

const ARROW_CLASSES = "group inline-flex items-center gap-3 text-platinum hover:text-lavender";

export function ArrowLink({ to, children, className = "" }: { to: string; children: ReactNode; className?: string }) {
  return (
    <Link to={to} className={`${ARROW_CLASSES} ${className}`}>
      <ArrowContent>{children}</ArrowContent>
    </Link>
  );
}

export function ArrowButton({ onClick, children, className = "" }: { onClick: () => void; children: ReactNode; className?: string }) {
  return (
    <button type="button" onClick={onClick} className={`${ARROW_CLASSES} ${className}`}>
      <ArrowContent>{children}</ArrowContent>
    </button>
  );
}

// ---- Surfaces ----

// The card surface: mocha-dark with a thin platinum border.
export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-[1.75rem] border border-platinum/30 bg-mocha-dark p-6 ${className}`}>{children}</div>;
}

// ---- Game pieces ----

// The price in a lavender circle.
export function PriceBadge({ price, label = "Price", size = "lg" }: { price: number; label?: string; size?: "sm" | "lg" }) {
  const circle = size === "lg" ? "size-20 text-4xl" : "size-12 text-2xl";
  return (
    <span className="inline-flex flex-col items-center gap-1.5">
      <span className={`display-italic grid place-items-center rounded-full bg-lavender text-mocha ${circle}`}>
        <span className="sr-only">{label}: </span>${price}
      </span>
      <Label>{label}</Label>
    </span>
  );
}

// Rating as a thin platinum bar. null = a mystery item (hidden rating).
export function RatingBar({ rating, className = "" }: { rating: number | null; className?: string }) {
  const percent = rating === null ? 0 : Math.max(0, Math.min(100, rating));
  return (
    <div className={className}>
      <div className="mb-1.5 flex items-baseline justify-between">
        <Label>Rating</Label>
        <span className="display-italic text-2xl text-lavender">{rating === null ? "?" : rating}</span>
      </div>
      <div
        className="h-[2px] w-full bg-platinum/20"
        role="meter"
        aria-label="Rating"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={rating ?? undefined}
        aria-valuetext={rating === null ? "hidden until the draft ends" : `${rating} out of 100`}
      >
        <div className="h-full bg-platinum" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

// Urgency without a warning colour: lavender-deep, an icon, and a pulse.
// (lavender-deep is 3.44:1 on mocha, so this sits on mocha-dark where it's 5.09:1.)
export function UrgentNote({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 font-body text-sm font-medium text-lavender-deep ${className}`}>
      <span aria-hidden className="animate-urgent grid size-5 place-items-center rounded-full ring-1 ring-lavender-deep text-[11px] font-bold">
        !
      </span>
      {children}
    </span>
  );
}

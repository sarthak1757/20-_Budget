import type { ButtonHTMLAttributes, ReactNode, Ref } from "react";
import { Link } from "react-router";
import { HelpButton } from "./HowToPlay";
import { MuteButton } from "./MuteButton";
import { Hairline, Label, PILL_CLASSES, UrgentNote, type PillVariant } from "./brand/primitives";

// Small building blocks shared by every page, so buttons and cards look the same everywhere.
// They use the editorial theme tokens (see /style-guide).

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

// "danger" has no red to use: it's an outlined pill with a lavender-deep ring.
const DANGER_CLASSES =
  "ring-1 ring-lavender-deep text-lavender hover:bg-mocha-light disabled:text-platinum/40 disabled:ring-platinum/30";

function variantClasses(variant: ButtonVariant): string {
  if (variant === "danger") {
    return DANGER_CLASSES;
  }
  const pill: PillVariant = variant;
  return PILL_CLASSES[pill];
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  ref?: Ref<HTMLButtonElement>; // React 19 passes ref as a normal prop
}

export function Button({ variant = "primary", className = "", ...rest }: ButtonProps) {
  const classes = `rounded-full px-6 py-3 font-body font-medium transition active:scale-[0.98] disabled:cursor-not-allowed disabled:active:scale-100 ${variantClasses(variant)} ${className}`;
  return <button type="button" className={classes} {...rest} />;
}

export function PageShell({ title, children, backTo }: { title?: string; children: ReactNode; backTo?: string }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-platinum/30 bg-mocha-dark">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-5 px-4 py-3 sm:px-8">
          {backTo !== undefined && (
            <Link to={backTo} className="label-caps text-platinum hover:text-lavender">
              ← Back
            </Link>
          )}
          <Link to="/" className="display-italic text-2xl text-lavender">
            Budget Draft
          </Link>
          <nav className="ml-auto hidden items-center gap-6 sm:flex" aria-label="Main">
            <Link to="/" className="label-caps text-platinum hover:text-lavender">
              Play
            </Link>
            <Link to="/daily" className="label-caps text-platinum hover:text-lavender">
              Daily
            </Link>
            <Link to="/leaderboard" className="label-caps text-platinum hover:text-lavender">
              Leaderboard
            </Link>
          </nav>
          <div className="ml-auto flex items-center gap-2 sm:ml-0">
            <MuteButton />
            <HelpButton />
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 pt-8 pb-16 sm:px-8 sm:pt-12">
        {title !== undefined && <h1 className="display-italic mb-10 text-5xl text-lavender sm:text-7xl">{title}</h1>}
        <main className="flex-1">{children}</main>
      </div>

      <footer className="border-t border-platinum/30 bg-mocha-dark">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-8">
          <Label>Build the best team with $20</Label>
          <Label className="text-platinum/70">No. 20</Label>
        </div>
      </footer>
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-[1.75rem] border border-platinum/30 bg-mocha-dark p-5 sm:p-6 ${className}`}>{children}</div>;
}

export function Spinner({ label = "Loading…" }: { label?: string }) {
  return (
    <div role="status" className="flex items-center justify-center gap-3 py-12 text-platinum">
      <span className="size-5 animate-spin rounded-full border border-platinum/30 border-t-lavender" />
      <Label>{label}</Label>
    </div>
  );
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="grid justify-items-start gap-4 rounded-[1.75rem] bg-mocha-dark p-5 ring-1 ring-lavender-deep">
      <UrgentNote>{message}</UrgentNote>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

// A hairline-separated heading used inside cards ("Players", "Rules").
export function CardTitle({ children }: { children: ReactNode }) {
  return (
    <div className="grid gap-3">
      <Label className="text-lavender">{children}</Label>
      <Hairline />
    </div>
  );
}

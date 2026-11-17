import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link } from "react-router";
import { MuteButton } from "./MuteButton";

// Small building blocks shared by every page, so buttons and cards look the same everywhere.

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "bg-emerald-500 text-zinc-950 hover:bg-emerald-400 disabled:bg-zinc-700 disabled:text-zinc-400",
  secondary: "bg-zinc-800 text-zinc-100 hover:bg-zinc-700 disabled:text-zinc-500",
  danger: "bg-rose-500 text-white hover:bg-rose-400 disabled:bg-zinc-700 disabled:text-zinc-400",
  ghost: "bg-transparent text-zinc-300 hover:bg-zinc-800 disabled:text-zinc-600",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export function Button({ variant = "primary", className = "", ...rest }: ButtonProps) {
  const classes = `rounded-xl px-4 py-3 font-semibold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:active:scale-100 ${VARIANT_CLASSES[variant]} ${className}`;
  return <button type="button" className={classes} {...rest} />;
}

export function PageShell({ title, children, backTo }: { title?: string; children: ReactNode; backTo?: string }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-4 pt-4 pb-10 sm:px-6">
      <header className="mb-6 flex items-center gap-3">
        {backTo !== undefined && (
          <Link to={backTo} className="rounded-lg px-2 py-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100">
            ← Back
          </Link>
        )}
        <Link to="/" className="text-lg font-black tracking-tight">
          💸 Budget <span className="text-money">Draft</span>
        </Link>
        <div className="ml-auto">
          <MuteButton />
        </div>
      </header>
      {title !== undefined && <h1 className="mb-6 text-3xl font-black tracking-tight sm:text-4xl">{title}</h1>}
      <main className="flex-1">{children}</main>
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-zinc-800 bg-zinc-900 p-4 ${className}`}>{children}</div>;
}

export function Spinner({ label = "Loading…" }: { label?: string }) {
  return (
    <div role="status" className="flex items-center justify-center gap-3 py-12 text-zinc-400">
      <span className="size-5 animate-spin rounded-full border-2 border-zinc-600 border-t-emerald-400" />
      {label}
    </div>
  );
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="rounded-2xl border border-rose-900 bg-rose-950/50 p-4 text-rose-200">
      <p>{message}</p>
      {onRetry && (
        <Button variant="secondary" className="mt-3" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

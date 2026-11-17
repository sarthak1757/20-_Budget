import { Link } from "react-router";
import { PageShell } from "../components/ui";

interface ModeOption {
  to: string;
  emoji: string;
  title: string;
  description: string;
  available: boolean;
}

const MODES: ModeOption[] = [
  {
    to: "/new/local",
    emoji: "📱",
    title: "Pass & Play",
    description: "2–4 players on one device. Hand it over when it's someone else's turn.",
    available: true,
  },
  {
    to: "/new/online",
    emoji: "🌐",
    title: "Online Room",
    description: "Create a room and share the code. Everyone plays on their own phone.",
    available: true,
  },
  {
    to: "/new/bot",
    emoji: "🤖",
    title: "Solo vs Bots",
    description: "Draft against 1–3 bots that hunt for value.",
    available: false,
  },
];

export function HomePage() {
  return (
    <PageShell>
      <section className="mb-8">
        <h1 className="text-4xl font-black tracking-tight sm:text-6xl">
          Who builds the better team with <span className="text-money">$20</span>?
        </h1>
        <p className="mt-3 max-w-xl text-zinc-400">
          Items are revealed one at a time. Buy or pass. Fill every slot without running out of money.
        </p>
      </section>

      <div className="grid gap-3 sm:grid-cols-3">
        {MODES.map((mode) => {
          const content = (
            <>
              <span className="text-4xl" aria-hidden>
                {mode.emoji}
              </span>
              <span className="mt-3 block text-xl font-bold">{mode.title}</span>
              <span className="mt-1 block text-sm text-zinc-400">{mode.description}</span>
              {!mode.available && <span className="mt-3 inline-block text-xs text-zinc-500">Coming soon</span>}
            </>
          );
          if (!mode.available) {
            return (
              <div key={mode.to} className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 opacity-60">
                {content}
              </div>
            );
          }
          return (
            <Link
              key={mode.to}
              to={mode.to}
              className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 transition hover:border-emerald-500 hover:bg-zinc-800"
            >
              {content}
            </Link>
          );
        })}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link to="/join" className="rounded-xl bg-zinc-800 px-4 py-3 font-semibold hover:bg-zinc-700">
          🔑 Join with a code
        </Link>
      </div>
    </PageShell>
  );
}

import { useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router";
import {
  DEFAULT_SETTINGS,
  MAX_PLAYERS,
  MAX_SLOTS,
  MIN_PLAYERS,
  MIN_SLOTS,
  type GameSettings,
  type NewPlayer,
} from "@budget-draft/shared";
import { Stepper } from "../components/Stepper";
import { Button, Card, ErrorBox, PageShell, Spinner } from "../components/ui";
import { fetchCategories, fetchCategoryItems } from "../lib/categories";
import { parseMode } from "../lib/modes";
import { useAsync } from "../lib/useAsync";
import { validateSetup } from "../lib/validateSetup";
import { useLocalGameStore } from "../store/localGameStore";

export function SetupPage() {
  const params = useParams();
  const mode = parseMode(params.mode);
  const categorySlug = params.categorySlug ?? "";
  const navigate = useNavigate();
  const startGame = useLocalGameStore((store) => store.start);

  const categories = useAsync(fetchCategories, []);
  const [names, setNames] = useState<string[]>(["", ""]);
  const [budget, setBudget] = useState(DEFAULT_SETTINGS.startingBudget);
  const [slots, setSlots] = useState(DEFAULT_SETTINGS.slotCount);
  const [problems, setProblems] = useState<string[]>([]);
  const [starting, setStarting] = useState(false);

  if (mode !== "local") {
    return <Navigate to="/" replace />;
  }

  let categoryName = categorySlug;
  if (categories.status === "ready") {
    const match = categories.data.find((category) => category.slug === categorySlug);
    if (!match) {
      return (
        <PageShell title="Category not found" backTo="/new/local">
          <ErrorBox message={`There's no category called "${categorySlug}".`} />
        </PageShell>
      );
    }
    categoryName = `${match.emoji} ${match.name}`;
  }

  function updateName(index: number, value: string) {
    const next = [...names];
    next[index] = value;
    setNames(next);
  }

  function addPlayer() {
    if (names.length < MAX_PLAYERS) {
      setNames([...names, ""]);
    }
  }

  function removePlayer(index: number) {
    if (names.length > MIN_PLAYERS) {
      const next = [];
      for (let i = 0; i < names.length; i++) {
        if (i !== index) {
          next.push(names[i] ?? "");
        }
      }
      setNames(next);
    }
  }

  async function handleStart() {
    const settings: GameSettings = {
      startingBudget: budget,
      slotCount: slots,
      turnSeconds: 0, // no timer: people are passing one phone around
      voteSeconds: 0,
      categorySlug,
    };
    const found = validateSetup(names, settings);
    setProblems(found);
    if (found.length > 0) {
      return;
    }

    setStarting(true);
    try {
      const items = await fetchCategoryItems(categorySlug);
      const players: NewPlayer[] = [];
      for (const name of names) {
        players.push({ id: crypto.randomUUID(), name: name.trim(), isBot: false });
      }
      startGame({ mode: "local", settings, players, items });
      navigate("/play");
    } catch (error) {
      setProblems([error instanceof Error ? error.message : "Couldn't load items"]);
      setStarting(false);
    }
  }

  return (
    <PageShell title="Game setup" backTo="/new/local">
      {categories.status === "loading" && <Spinner />}
      {categories.status === "error" && <ErrorBox message={categories.message} onRetry={categories.retry} />}
      {categories.status === "ready" && (
        <div className="mx-auto grid max-w-xl gap-4">
          <p className="text-zinc-400">
            Category: <span className="font-semibold text-zinc-100">{categoryName}</span>
          </p>

          <Card>
            <h2 className="mb-3 font-bold">Players</h2>
            <div className="grid gap-2">
              {names.map((name, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    value={name}
                    onChange={(event) => updateName(index, event.target.value)}
                    placeholder={`Player ${index + 1}`}
                    maxLength={20}
                    aria-label={`Player ${index + 1} name`}
                    className="min-w-0 flex-1 rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-3 outline-none focus:border-emerald-500"
                  />
                  {names.length > MIN_PLAYERS && (
                    <Button variant="ghost" onClick={() => removePlayer(index)} aria-label={`Remove player ${index + 1}`}>
                      ✕
                    </Button>
                  )}
                </div>
              ))}
            </div>
            {names.length < MAX_PLAYERS && (
              <Button variant="secondary" className="mt-3 w-full" onClick={addPlayer}>
                + Add player
              </Button>
            )}
          </Card>

          <Card className="grid gap-3">
            <h2 className="font-bold">Rules</h2>
            <Stepper label="Budget" value={budget} min={5} max={50} format={(v) => `$${v}`} onChange={setBudget} />
            <Stepper label="Slots" value={slots} min={MIN_SLOTS} max={MAX_SLOTS} onChange={setSlots} />
            <p className="text-sm text-zinc-500">
              You must always keep at least $1 for each empty slot, so you can't blow it all on one pick.
            </p>
          </Card>

          {problems.length > 0 && (
            <div role="alert" className="rounded-2xl border border-rose-900 bg-rose-950/50 p-4 text-rose-200">
              <ul className="list-inside list-disc">
                {problems.map((problem) => (
                  <li key={problem}>{problem}</li>
                ))}
              </ul>
            </div>
          )}

          <Button onClick={handleStart} disabled={starting} className="py-4 text-lg">
            {starting ? "Starting…" : "Start draft"}
          </Button>
        </div>
      )}
    </PageShell>
  );
}

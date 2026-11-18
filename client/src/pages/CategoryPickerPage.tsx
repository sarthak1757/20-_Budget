import { Link, Navigate, useParams } from "react-router";
import { CUSTOM_CATEGORY_SLUG } from "@budget-draft/shared";
import { Label } from "../components/brand/primitives";
import { ErrorBox, PageShell, Spinner } from "../components/ui";
import { fetchCategories } from "../lib/categories";
import { parseMode } from "../lib/modes";
import { useAsync } from "../lib/useAsync";

const CARD_CLASS =
  "group grid min-h-56 content-between gap-8 rounded-[1.75rem] border p-6 transition hover:bg-ink-hover/40 hover:shadow-glow";

function ArrowCircle() {
  return (
    <span
      aria-hidden
      className="grid size-10 place-items-center rounded-full text-mist ring-1 ring-mist/60 transition group-hover:bg-ivory group-hover:text-ink group-hover:ring-ivory"
    >
      →
    </span>
  );
}

export function CategoryPickerPage() {
  const mode = parseMode(useParams().mode);
  const categories = useAsync(fetchCategories, []);

  if (mode === null) {
    return <Navigate to="/" replace />;
  }

  return (
    <PageShell title="Pick a category" backTo="/">
      {categories.status === "loading" && <Spinner label="Loading categories…" />}
      {categories.status === "error" && <ErrorBox message={categories.message} onRetry={categories.retry} />}
      {categories.status === "ready" && categories.data.length === 0 && (
        <p className="text-mist">
          No categories yet. Run <code className="font-mono text-ivory">npm run seed</code> or add one in the admin page.
        </p>
      )}
      {categories.status === "ready" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.data.map((category, index) => (
            <Link
              key={category.slug}
              to={`/new/${mode}/${category.slug}`}
              className={`${CARD_CLASS} border-mist/15 bg-ink-raised hover:border-gold`}
            >
              <span className="flex items-start justify-between">
                <Label className="text-mist/80">{String(index + 1).padStart(2, "0")}</Label>
                {/* The category's own emoji is part of its data (set in the admin page). */}
                <span className="text-3xl" aria-hidden>
                  {category.emoji}
                </span>
              </span>
              <span className="grid gap-2">
                <span className="display-serif text-4xl text-ivory">{category.name}</span>
                <span className="text-sm text-mist">{category.description}</span>
              </span>
              <span className="flex items-center justify-between">
                <Label>{category.itemCount} items</Label>
                <ArrowCircle />
              </span>
            </Link>
          ))}
          {mode === "online" && (
            <Link
              to={`/new/online/${CUSTOM_CATEGORY_SLUG}`}
              className={`${CARD_CLASS} border-dashed border-mist/50 hover:border-gold`}
            >
              <Label className="text-gold">Custom</Label>
              <span className="grid gap-2">
                <span className="display-serif text-4xl text-ivory">Your own list</span>
                <span className="text-sm text-mist">Paste 20–150 items. Used for this room only, never saved.</span>
              </span>
              <span className="flex items-center justify-between">
                <Label>20–150 items</Label>
                <ArrowCircle />
              </span>
            </Link>
          )}
        </div>
      )}
    </PageShell>
  );
}

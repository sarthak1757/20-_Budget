import { Link, Navigate, useParams } from "react-router";
import { CUSTOM_CATEGORY_SLUG } from "@budget-draft/shared";
import { ErrorBox, PageShell, Spinner } from "../components/ui";
import { fetchCategories } from "../lib/categories";
import { parseMode } from "../lib/modes";
import { useAsync } from "../lib/useAsync";

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
        <p className="text-zinc-400">No categories yet. Run <code>npm run seed</code> or add one in the admin page.</p>
      )}
      {categories.status === "ready" && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.data.map((category) => (
            <Link
              key={category.slug}
              to={`/new/${mode}/${category.slug}`}
              className="flex items-start gap-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-4 transition hover:border-emerald-500 hover:bg-zinc-800"
            >
              <span className="text-4xl" aria-hidden>
                {category.emoji}
              </span>
              <span>
                <span className="block text-lg font-bold">{category.name}</span>
                <span className="mt-1 block text-sm text-zinc-400">{category.description}</span>
                <span className="mt-2 block text-xs text-zinc-500">{category.itemCount} items</span>
              </span>
            </Link>
          ))}
          {mode === "online" && (
            <Link
              to={`/new/online/${CUSTOM_CATEGORY_SLUG}`}
              className="flex items-start gap-4 rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/50 p-4 transition hover:border-emerald-500 hover:bg-zinc-800"
            >
              <span className="text-4xl" aria-hidden>
                ✏️
              </span>
              <span>
                <span className="block text-lg font-bold">Your own list</span>
                <span className="mt-1 block text-sm text-zinc-400">
                  Paste 20–150 items. Used for this room only, never saved.
                </span>
              </span>
            </Link>
          )}
        </div>
      )}
    </PageShell>
  );
}

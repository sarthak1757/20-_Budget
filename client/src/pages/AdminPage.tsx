import { useCallback, useEffect, useState, type FormEvent } from "react";
import type { AdminCategoryPayload, AdminItemPayload, Category, Item } from "@budget-draft/shared";
import { CategoryForm } from "../components/admin/CategoryForm";
import { ItemForm } from "../components/admin/ItemForm";
import { Avatar } from "../components/Avatar";
import { Button, Card, ErrorBox, PageShell, Spinner } from "../components/ui";
import { adminApi, getAdminPassword, setAdminPassword } from "../lib/adminApi";

export function AdminPage() {
  const [loggedIn, setLoggedIn] = useState(() => getAdminPassword() !== "");

  function logOut() {
    setAdminPassword("");
    setLoggedIn(false);
  }

  return (
    <PageShell title="Admin" backTo="/">
      {loggedIn ? <AdminDashboard onLogOut={logOut} /> : <AdminLogin onSuccess={() => setLoggedIn(true)} />}
    </PageShell>
  );
}

function AdminLogin({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setChecking(true);
    setError(null);
    try {
      await adminApi.check(password);
      setAdminPassword(password);
      onSuccess();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Login failed");
    } finally {
      setChecking(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto grid max-w-sm gap-3">
      <label className="grid gap-1">
        <span className="text-sm text-zinc-400">Admin password</span>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-3 outline-none focus:border-emerald-500"
        />
      </label>
      {error && (
        <p role="alert" className="text-rose-400">
          {error}
        </p>
      )}
      <Button type="submit" disabled={checking || password === ""}>
        {checking ? "Checking…" : "Log in"}
      </Button>
    </form>
  );
}

function AdminDashboard({ onLogOut }: { onLogOut: () => void }) {
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState(false);

  const loadCategories = useCallback(async () => {
    setLoadError(null);
    try {
      setCategories(await adminApi.listCategories());
    } catch (error) {
      const message = error instanceof Error ? error.message : "Couldn't load categories";
      // A wrong stored password (e.g. it was changed) sends you back to the login form.
      if (message === "Wrong admin password") {
        onLogOut();
        return;
      }
      setLoadError(message);
    }
  }, [onLogOut]);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  async function createCategory(values: AdminCategoryPayload) {
    await adminApi.createCategory(values);
    await loadCategories();
    setSelectedSlug(values.slug);
  }

  async function updateCategory(values: AdminCategoryPayload) {
    await adminApi.updateCategory(values.slug, { name: values.name, emoji: values.emoji, description: values.description });
    setEditingCategory(false);
    await loadCategories();
  }

  async function deleteCategory(category: Category) {
    const ok = window.confirm(`Delete "${category.name}" and all ${category.itemCount} items? This can't be undone.`);
    if (!ok) {
      return;
    }
    try {
      await adminApi.deleteCategory(category.slug);
      setSelectedSlug(null);
      await loadCategories();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Couldn't delete");
    }
  }

  if (loadError !== null) {
    return <ErrorBox message={loadError} onRetry={() => void loadCategories()} />;
  }
  if (categories === null) {
    return <Spinner label="Loading categories…" />;
  }

  const selected = categories.find((category) => category.slug === selectedSlug);

  return (
    <div className="grid gap-4 lg:grid-cols-[18rem_1fr]">
      <aside className="grid content-start gap-3">
        <Card>
          <h2 className="mb-2 font-bold">Categories</h2>
          {categories.length === 0 && <p className="text-sm text-zinc-500">No categories yet.</p>}
          <ul className="grid gap-1">
            {categories.map((category) => (
              <li key={category.slug}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSlug(category.slug);
                    setEditingCategory(false);
                  }}
                  className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left hover:bg-zinc-800 ${category.slug === selectedSlug ? "bg-zinc-800" : ""}`}
                >
                  <span aria-hidden>{category.emoji}</span>
                  <span className="flex-1 truncate">{category.name}</span>
                  <span className="text-xs text-zinc-500">{category.itemCount}</span>
                </button>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <h2 className="mb-3 font-bold">New category</h2>
          <CategoryForm onSave={createCategory} />
        </Card>
        <Button variant="ghost" onClick={onLogOut}>
          Log out
        </Button>
      </aside>

      <section className="grid content-start gap-4">
        {!selected && <p className="text-zinc-400">Pick a category to edit its items.</p>}
        {selected && (
          <>
            <Card>
              {editingCategory ? (
                <CategoryForm initial={selected} onSave={updateCategory} onCancel={() => setEditingCategory(false)} />
              ) : (
                <div className="flex flex-wrap items-start gap-3">
                  <div className="flex-1">
                    <h2 className="text-2xl font-black">
                      {selected.emoji} {selected.name}
                    </h2>
                    <p className="text-sm text-zinc-400">{selected.description}</p>
                    <p className="mt-1 font-mono text-xs text-zinc-500">{selected.slug}</p>
                  </div>
                  <Button variant="secondary" className="py-2" onClick={() => setEditingCategory(true)}>
                    Edit
                  </Button>
                  <Button variant="danger" className="py-2" onClick={() => void deleteCategory(selected)}>
                    Delete
                  </Button>
                </div>
              )}
            </Card>
            <ItemsEditor key={selected.slug} slug={selected.slug} onItemsChanged={() => void loadCategories()} />
          </>
        )}
      </section>
    </div>
  );
}

function ItemsEditor({ slug, onItemsChanged }: { slug: string; onItemsChanged: () => void }) {
  const [items, setItems] = useState<Item[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const loadItems = useCallback(async () => {
    setError(null);
    try {
      setItems(await adminApi.listItems(slug));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Couldn't load items");
    }
  }, [slug]);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  async function createItem(values: AdminItemPayload) {
    await adminApi.createItem(slug, values);
    await loadItems();
    onItemsChanged();
  }

  async function updateItem(id: string, values: AdminItemPayload) {
    await adminApi.updateItem(id, values);
    setEditingId(null);
    await loadItems();
  }

  async function deleteItem(item: Item) {
    if (!window.confirm(`Delete "${item.name}"?`)) {
      return;
    }
    try {
      await adminApi.deleteItem(item.id);
      await loadItems();
      onItemsChanged();
    } catch (requestError) {
      window.alert(requestError instanceof Error ? requestError.message : "Couldn't delete");
    }
  }

  return (
    <>
      <Card>
        <h3 className="mb-3 font-bold">Add item</h3>
        <ItemForm onSave={createItem} />
      </Card>
      <Card>
        <h3 className="mb-3 font-bold">Items {items && `(${items.length})`}</h3>
        {error && <ErrorBox message={error} onRetry={() => void loadItems()} />}
        {!error && items === null && <Spinner />}
        {items && items.length === 0 && <p className="text-sm text-zinc-500">No items yet. Games need at least a few.</p>}
        {items && items.length > 0 && (
          <ul className="divide-y divide-zinc-800">
            {items.map((item) => (
              <li key={item.id} className="py-2">
                {editingId === item.id ? (
                  <ItemForm initial={item} onSave={(values) => updateItem(item.id, values)} onCancel={() => setEditingId(null)} />
                ) : (
                  <div className="flex items-center gap-3">
                    <Avatar name={item.name} emoji={item.emoji} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{item.name}</span>
                      <span className="block text-xs text-zinc-500">{item.tag}</span>
                    </span>
                    <span className="text-money w-10 text-right tabular-nums">${item.price}</span>
                    <span className="w-8 text-right font-bold tabular-nums">{item.rating}</span>
                    <Button variant="ghost" className="px-2 py-1 text-sm" onClick={() => setEditingId(item.id)}>
                      Edit
                    </Button>
                    <Button variant="ghost" className="px-2 py-1 text-sm text-rose-400" onClick={() => void deleteItem(item)}>
                      Delete
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}

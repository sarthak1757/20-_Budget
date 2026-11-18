import { useCallback, useEffect, useState, type FormEvent } from "react";
import type { AdminCategoryPayload, AdminItemPayload, Category, Item } from "@budget-draft/shared";
import { CategoryForm } from "../components/admin/CategoryForm";
import { ItemForm } from "../components/admin/ItemForm";
import { Avatar } from "../components/Avatar";
import { INPUT_CLASS, Label, UrgentNote } from "../components/brand/primitives";
import { Button, Card, CardTitle, ErrorBox, PageShell, Spinner } from "../components/ui";
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
    <form onSubmit={handleSubmit} className="grid max-w-sm gap-5">
      <label className="grid gap-2">
        <Label>Admin password</Label>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          className={INPUT_CLASS}
        />
      </label>
      {error && (
        <p role="alert">
          <UrgentNote>{error}</UrgentNote>
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
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[19rem_minmax(0,1fr)]">
      <aside className="grid grid-cols-[minmax(0,1fr)] content-start gap-4">
        <Card className="grid gap-4">
          <CardTitle>Categories</CardTitle>
          {categories.length === 0 && <p className="text-sm text-mist">No categories yet.</p>}
          <ul className="grid">
            {categories.map((category) => (
              <li key={category.slug}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSlug(category.slug);
                    setEditingCategory(false);
                  }}
                  className={`flex w-full items-center gap-3 border-t border-mist/15 px-2 py-3 text-left transition hover:bg-ink-hover/40 ${category.slug === selectedSlug ? "bg-ink" : ""}`}
                >
                  <span aria-hidden>{category.emoji}</span>
                  <span className="display-serif min-w-0 flex-1 truncate text-xl text-ivory">{category.name}</span>
                  <Label className="text-mist/80">{category.itemCount}</Label>
                </button>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="grid gap-4">
          <CardTitle>New category</CardTitle>
          <CategoryForm onSave={createCategory} />
        </Card>
        <Button variant="ghost" onClick={onLogOut}>
          Log out
        </Button>
      </aside>

      <section className="grid grid-cols-[minmax(0,1fr)] content-start gap-4">
        {!selected && <p className="text-mist">Pick a category to edit its items.</p>}
        {selected && (
          <>
            <Card>
              {editingCategory ? (
                <CategoryForm initial={selected} onSave={updateCategory} onCancel={() => setEditingCategory(false)} />
              ) : (
                <div className="flex flex-wrap items-start gap-3">
                  <div className="grid flex-1 gap-1">
                    <h2 className="display-serif text-4xl text-ivory">
                      {selected.emoji} {selected.name}
                    </h2>
                    <p className="text-sm text-mist">{selected.description}</p>
                    <Label className="text-mist/80">{selected.slug}</Label>
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
      <Card className="grid gap-4">
        <CardTitle>Add item</CardTitle>
        <ItemForm onSave={createItem} />
      </Card>
      <Card className="grid gap-4">
        <CardTitle>Items {items && `(${items.length})`}</CardTitle>
        {error && <ErrorBox message={error} onRetry={() => void loadItems()} />}
        {!error && items === null && <Spinner />}
        {items && items.length === 0 && <p className="text-sm text-mist">No items yet. Games need at least a few.</p>}
        {items && items.length > 0 && (
          <ul>
            {items.map((item) => (
              <li key={item.id} className="border-t border-mist/15 py-3 last:border-b">
                {editingId === item.id ? (
                  <ItemForm initial={item} onSave={(values) => updateItem(item.id, values)} onCancel={() => setEditingId(null)} />
                ) : (
                  <div className="flex items-center gap-3">
                    <Avatar name={item.name} emoji={item.emoji} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="display-serif block truncate text-xl text-ivory">{item.name}</span>
                      <Label className="text-mist/80">{item.tag}</Label>
                    </span>
                    <span className="w-10 text-right text-mist tabular-nums">${item.price}</span>
                    <span className="display-serif w-10 text-right text-2xl text-ivory tabular-nums">{item.rating}</span>
                    <Button variant="ghost" className="px-3 py-1 text-sm" onClick={() => setEditingId(item.id)}>
                      Edit
                    </Button>
                    <Button variant="ghost" className="px-3 py-1 text-sm" onClick={() => void deleteItem(item)}>
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

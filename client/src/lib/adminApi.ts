import type {
  AdminCategoryPayload,
  AdminCategoryUpdatePayload,
  AdminItemPayload,
  Category,
  Item,
} from "@budget-draft/shared";
import { apiRequest } from "./api";

// The admin password lives in sessionStorage: it survives a refresh but is
// forgotten when the tab closes. Every admin request sends it as a header.
const PASSWORD_KEY = "budget-draft:admin-password";

export function getAdminPassword(): string {
  try {
    return sessionStorage.getItem(PASSWORD_KEY) ?? "";
  } catch {
    return "";
  }
}

export function setAdminPassword(password: string): void {
  try {
    if (password === "") {
      sessionStorage.removeItem(PASSWORD_KEY);
    } else {
      sessionStorage.setItem(PASSWORD_KEY, password);
    }
  } catch {
    // ignore: the user just has to log in again after a refresh
  }
}

function adminRequest<T>(path: string, options: { method?: string; body?: unknown; password?: string } = {}) {
  const password = options.password ?? getAdminPassword();
  const request: { method?: string; body?: unknown; headers: Record<string, string> } = {
    headers: { "x-admin-password": password },
  };
  if (options.method !== undefined) request.method = options.method;
  if (options.body !== undefined) request.body = options.body;
  return apiRequest<T>(`/api/admin${path}`, request);
}

export const adminApi = {
  check: (password: string) => adminRequest<{ ok: true }>("/check", { password }),
  listCategories: () => adminRequest<Category[]>("/categories"),
  createCategory: (body: AdminCategoryPayload) => adminRequest<AdminCategoryPayload>("/categories", { method: "POST", body }),
  updateCategory: (slug: string, body: AdminCategoryUpdatePayload) =>
    adminRequest<AdminCategoryPayload>(`/categories/${slug}`, { method: "PUT", body }),
  deleteCategory: (slug: string) => adminRequest<void>(`/categories/${slug}`, { method: "DELETE" }),
  listItems: (slug: string) => adminRequest<Item[]>(`/categories/${slug}/items`),
  createItem: (slug: string, body: AdminItemPayload) =>
    adminRequest<Item>(`/categories/${slug}/items`, { method: "POST", body }),
  updateItem: (id: string, body: AdminItemPayload) => adminRequest<Item>(`/items/${id}`, { method: "PUT", body }),
  deleteItem: (id: string) => adminRequest<void>(`/items/${id}`, { method: "DELETE" }),
};

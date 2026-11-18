import type { ApiError } from "@budget-draft/shared";

// Where the API and Socket.io live.
// Production: the same server that sent this page, so always our own origin.
// Development: Vite runs on :5173 and the server on :4000 (or VITE_SERVER_URL).
export const SERVER_URL: string = import.meta.env.PROD
  ? window.location.origin
  : (import.meta.env.VITE_SERVER_URL ?? "http://localhost:4000");

// Small fetch wrapper: turns non-2xx responses into Errors with the
// server's message, and gives up after a timeout instead of hanging forever.
export async function apiRequest<T>(
  path: string,
  options: { method?: string; body?: unknown; headers?: Record<string, string>; timeoutMs?: number } = {},
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? 8000);

  const init: RequestInit = {
    method: options.method ?? "GET",
    headers: { "Content-Type": "application/json", ...options.headers },
    signal: controller.signal,
  };
  if (options.body !== undefined) {
    init.body = JSON.stringify(options.body);
  }

  let response: Response;
  try {
    response = await fetch(`${SERVER_URL}${path}`, init);
  } catch {
    throw new Error("Can't reach the server. Is it running?");
  } finally {
    clearTimeout(timer);
  }

  if (response.status === 204) {
    return undefined as T;
  }
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message = isApiError(body) ? body.error : `Request failed (${response.status})`;
    throw new Error(message);
  }
  // The server and client share these types, so we trust the shape here.
  return body as T;
}

function isApiError(value: unknown): value is ApiError {
  return typeof value === "object" && value !== null && typeof (value as { error?: unknown }).error === "string";
}

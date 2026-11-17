import { create } from "zustand";

export type ToastTone = "info" | "success" | "warning";

export interface Toast {
  id: number;
  message: string;
  tone: ToastTone;
}

interface ToastStore {
  toasts: Toast[];
  // durationMs = null keeps the toast until dismissToast is called. Returns the toast id.
  showToast: (message: string, tone?: ToastTone, durationMs?: number | null) => number;
  dismissToast: (id: number) => void;
}

let nextId = 1;

// Small pop-up messages ("Connection lost", "Back online").
// Kept in a store so non-React code (like socket listeners) can show them too.
export const useToastStore = create<ToastStore>()((set, get) => ({
  toasts: [],
  showToast: (message, tone = "info", durationMs = 3500) => {
    const id = nextId++;
    // Replace an identical message instead of stacking duplicates.
    const others = get().toasts.filter((toast) => toast.message !== message);
    set({ toasts: [...others, { id, message, tone }] });
    if (durationMs !== null) {
      setTimeout(() => get().dismissToast(id), durationMs);
    }
    return id;
  },
  dismissToast: (id) => set({ toasts: get().toasts.filter((toast) => toast.id !== id) }),
}));

export function showToast(message: string, tone?: ToastTone, durationMs?: number | null): number {
  return useToastStore.getState().showToast(message, tone, durationMs);
}

export function dismissToast(id: number): void {
  useToastStore.getState().dismissToast(id);
}

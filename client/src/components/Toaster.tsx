import { useToastStore, type ToastTone } from "../store/toastStore";

const TONE_CLASSES: Record<ToastTone, string> = {
  info: "border-zinc-700 bg-zinc-800 text-zinc-100",
  success: "border-emerald-700 bg-emerald-950 text-emerald-100",
  warning: "border-amber-700 bg-amber-950 text-amber-100",
};

// Shows toasts at the top of the screen, away from the BUY/PASS buttons and other main actions.
export function Toaster() {
  const toasts = useToastStore((store) => store.toasts);
  const dismissToast = useToastStore((store) => store.dismissToast);

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-3 z-50 flex flex-col items-center gap-2 px-4 pt-[env(safe-area-inset-top)]"
    >
      {toasts.map((toast) => (
        <button
          key={toast.id}
          type="button"
          onClick={() => dismissToast(toast.id)}
          className={`animate-toast-in pointer-events-auto max-w-sm rounded-xl border px-4 py-3 text-sm font-semibold shadow-xl ${TONE_CLASSES[toast.tone]}`}
        >
          {toast.message}
        </button>
      ))}
    </div>
  );
}

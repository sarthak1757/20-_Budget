import { useSoundStore } from "../store/soundStore";

export function MuteButton() {
  const muted = useSoundStore((store) => store.muted);
  const toggleMuted = useSoundStore((store) => store.toggleMuted);
  return (
    <button
      type="button"
      onClick={toggleMuted}
      aria-label={muted ? "Turn sound on" : "Turn sound off"}
      aria-pressed={muted}
      title={muted ? "Sound off" : "Sound on"}
      className="rounded-lg px-2 py-1 text-lg hover:bg-zinc-800"
    >
      {muted ? "🔇" : "🔊"}
    </button>
  );
}

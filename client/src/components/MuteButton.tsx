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
      className="grid size-9 place-items-center rounded-full text-sm text-platinum ring-1 ring-platinum/60 hover:bg-mocha-light"
    >
      {muted ? "🔇" : "🔊"}
    </button>
  );
}

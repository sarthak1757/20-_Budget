import { Volume2, VolumeX } from "lucide-react";
import { useSoundStore } from "../store/soundStore";
import { ICON_STROKE } from "./brand/primitives";

export function MuteButton() {
  const muted = useSoundStore((store) => store.muted);
  const toggleMuted = useSoundStore((store) => store.toggleMuted);
  const Icon = muted ? VolumeX : Volume2;
  return (
    <button
      type="button"
      onClick={toggleMuted}
      aria-label={muted ? "Turn sound on" : "Turn sound off"}
      aria-pressed={muted}
      title={muted ? "Sound off" : "Sound on"}
      className="grid size-11 place-items-center rounded-full text-mist ring-1 ring-mist/60 hover:bg-ink-hover"
    >
      <Icon size={16} strokeWidth={ICON_STROKE} className={muted ? "text-gold" : ""} aria-hidden />
    </button>
  );
}

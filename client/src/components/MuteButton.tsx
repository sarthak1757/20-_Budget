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
      className="grid size-9 place-items-center rounded-full text-platinum ring-1 ring-platinum/60 hover:bg-mocha-light"
    >
      <Icon size={16} strokeWidth={ICON_STROKE} className={muted ? "text-lavender-deep" : ""} aria-hidden />
    </button>
  );
}

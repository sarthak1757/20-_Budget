import { create } from "zustand";
import { loadMuted, playNotes, saveMuted, SOUNDS, type SoundName } from "../lib/sound";

interface SoundStore {
  muted: boolean;
  toggleMuted: () => void;
}

// The mute setting, shared by the header button and everything that plays sounds.
export const useSoundStore = create<SoundStore>()((set, get) => ({
  muted: loadMuted(),
  toggleMuted: () => {
    const muted = !get().muted;
    saveMuted(muted);
    set({ muted });
  },
}));

export function playSound(name: SoundName): void {
  if (!useSoundStore.getState().muted) {
    playNotes(SOUNDS[name]);
  }
}

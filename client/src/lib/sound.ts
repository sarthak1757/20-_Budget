import type { PublicGameEvent } from "@budget-draft/shared";

// Sound effects made on the fly with the Web Audio API: no audio files to
// download. Each sound is a few short notes. An oscillator makes a tone, a
// gain node is its volume; we fade the volume out so notes don't click.

export type SoundName = "buy" | "pass" | "tick" | "win";

interface Note {
  frequency: number; // Hz
  start: number; // seconds after the sound starts
  duration: number; // seconds
  wave: OscillatorType;
  volume: number; // 0–1
}

export const SOUNDS: Record<SoundName, Note[]> = {
  // Two rising notes: a happy "ka-ching".
  buy: [
    { frequency: 660, start: 0, duration: 0.08, wave: "triangle", volume: 0.25 },
    { frequency: 990, start: 0.08, duration: 0.14, wave: "triangle", volume: 0.25 },
  ],
  // Two falling low notes: a soft "nope".
  pass: [
    { frequency: 330, start: 0, duration: 0.08, wave: "sine", volume: 0.2 },
    { frequency: 247, start: 0.08, duration: 0.12, wave: "sine", volume: 0.2 },
  ],
  // A very short, quiet click for the last seconds of a timer.
  tick: [{ frequency: 1200, start: 0, duration: 0.03, wave: "square", volume: 0.06 }],
  // C-E-G-C arpeggio.
  win: [
    { frequency: 523, start: 0, duration: 0.12, wave: "triangle", volume: 0.25 },
    { frequency: 659, start: 0.12, duration: 0.12, wave: "triangle", volume: 0.25 },
    { frequency: 784, start: 0.24, duration: 0.12, wave: "triangle", volume: 0.25 },
    { frequency: 1047, start: 0.36, duration: 0.35, wave: "triangle", volume: 0.25 },
  ],
};

// Which sound (if any) a batch of game events should make. A buy wins over
// a pass, since one action can produce both (e.g. the last player passes and
// the item goes to the high bidder).
export function soundForEvents(events: PublicGameEvent[]): SoundName | null {
  let sound: SoundName | null = null;
  for (const event of events) {
    if (event.type === "bought") {
      return "buy";
    }
    if (event.type === "passed") {
      sound = "pass";
    }
  }
  return sound;
}

const MUTED_KEY = "budget-draft:muted";

export function loadMuted(): boolean {
  try {
    return localStorage.getItem(MUTED_KEY) === "true";
  } catch {
    return false;
  }
}

export function saveMuted(muted: boolean): void {
  try {
    localStorage.setItem(MUTED_KEY, String(muted));
  } catch {
    // Not fatal: the setting just won't survive a reload.
  }
}

// One shared AudioContext, created on first use. Browsers only allow sound
// after the user has clicked something, which is always true by the time
// a game makes a sound.
let audioContext: AudioContext | null = null;

export function playNotes(notes: Note[]): void {
  if (typeof window === "undefined" || typeof window.AudioContext === "undefined") {
    return;
  }
  try {
    audioContext ??= new AudioContext();
    const ctx = audioContext;
    if (ctx.state === "suspended") {
      void ctx.resume();
    }
    const now = ctx.currentTime;
    for (const note of notes) {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = note.wave;
      oscillator.frequency.value = note.frequency;
      const start = now + note.start;
      const end = start + note.duration;
      gain.gain.setValueAtTime(note.volume, start);
      gain.gain.exponentialRampToValueAtTime(0.0001, end); // fade out, no click
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start(start);
      oscillator.stop(end);
    }
  } catch {
    // Sound is a nice extra; never let it break the game.
  }
}

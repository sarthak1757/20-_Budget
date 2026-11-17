import { useEffect, useRef } from "react";
import type { PublicGameState } from "@budget-draft/shared";
import { playSound } from "../store/soundStore";
import { soundForEvents } from "./sound";

// Plays a sound when new buy/pass events arrive. The same events can arrive
// twice (a reconnect resends the state), so we remember the last batch we
// played, by round and content, and skip repeats.
export function useGameSounds(state: PublicGameState): void {
  const lastPlayed = useRef<string | null>(null);
  useEffect(() => {
    if (state.lastEvents.length === 0) {
      return;
    }
    const key = `${state.roundNumber}:${JSON.stringify(state.lastEvents)}`;
    if (lastPlayed.current === null) {
      // First render (page load or reconnect): don't replay old events.
      lastPlayed.current = key;
      return;
    }
    if (key === lastPlayed.current) {
      return;
    }
    lastPlayed.current = key;
    const sound = soundForEvents(state.lastEvents);
    if (sound !== null) {
      playSound(sound);
    }
  }, [state.roundNumber, state.lastEvents]);
}

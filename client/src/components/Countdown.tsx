import { useEffect, useRef, useState } from "react";
import { playSound } from "../store/soundStore";

interface CountdownProps {
  deadline: number | null; // epoch ms from the server
  totalSeconds: number;
  label: string;
}

// Shows the seconds left on a server timer as a shrinking bar.
// Phone clocks are often a few seconds off from the server, so we never show
// more than the full timer length: the server decides when time is up anyway.
export function Countdown({ deadline, totalSeconds, label }: CountdownProps) {
  const [now, setNow] = useState(() => Date.now());
  const [localEnd, setLocalEnd] = useState<number | null>(null);

  useEffect(() => {
    if (deadline === null) {
      setLocalEnd(null);
      return;
    }
    const remaining = Math.min(deadline - Date.now(), totalSeconds * 1000);
    setLocalEnd(Date.now() + Math.max(0, remaining));
  }, [deadline, totalSeconds]);

  useEffect(() => {
    if (localEnd === null) {
      return;
    }
    const interval = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(interval);
  }, [localEnd]);

  const running = localEnd !== null && totalSeconds > 0;
  const msLeft = localEnd === null ? 0 : Math.max(0, localEnd - now);
  const secondsLeft = Math.ceil(msLeft / 1000);

  // Tick once per second during the last 5 seconds.
  const lastTick = useRef<number | null>(null);
  useEffect(() => {
    if (running && secondsLeft > 0 && secondsLeft <= 5 && lastTick.current !== secondsLeft) {
      playSound("tick");
    }
    lastTick.current = secondsLeft;
  }, [running, secondsLeft]);

  if (!running) {
    return null;
  }
  const percent = Math.min(100, (msLeft / (totalSeconds * 1000)) * 100);
  const urgent = secondsLeft <= 5;

  return (
    <div role="timer" aria-label={`${label}: ${secondsLeft} seconds left`}>
      <div className="mb-1 flex justify-between text-sm">
        <span className="text-zinc-400">{label}</span>
        <span className={`font-bold tabular-nums ${urgent ? "text-rose-400" : "text-zinc-200"}`}>{secondsLeft}s</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
        <div
          className={`h-full rounded-full transition-[width] duration-200 ease-linear ${urgent ? "bg-rose-500" : "bg-emerald-400"}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

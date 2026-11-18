import { useEffect, useState } from "react";
import { REACTION_COOLDOWN_MS, REACTION_EMOJIS, type Reaction, type ReactionPayload } from "@budget-draft/shared";
import { Label } from "./brand/primitives";

// The 5 reaction buttons. They fade for a second after a click,
// matching the server's limit of one reaction per second.
// The emoji stay full-colour on purpose: reactions are player expression.
export function ReactionBar({ onReact }: { onReact: (emoji: ReactionPayload["emoji"]) => void }) {
  const [coolingDown, setCoolingDown] = useState(false);

  useEffect(() => {
    if (!coolingDown) {
      return;
    }
    const timer = setTimeout(() => setCoolingDown(false), REACTION_COOLDOWN_MS);
    return () => clearTimeout(timer);
  }, [coolingDown]);

  function send(emoji: ReactionPayload["emoji"]) {
    setCoolingDown(true);
    onReact(emoji);
  }

  return (
    <div className="flex items-center justify-center gap-2" role="group" aria-label="Send a reaction">
      <Label className="mr-1 hidden text-mist/80 sm:inline">React</Label>
      {REACTION_EMOJIS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          onClick={() => send(emoji)}
          disabled={coolingDown}
          aria-label={`React ${emoji}`}
          className="grid size-11 place-items-center rounded-full text-xl ring-1 ring-mist/40 transition hover:bg-ink-hover active:scale-90 disabled:opacity-40"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}

// Spreads reactions across the screen. Based on the id (not random) so a
// re-render never makes one jump sideways.
export function reactionLeftPercent(id: number): number {
  return 10 + ((id * 37) % 80);
}

// Reactions floating up over the board. Doesn't catch clicks.
export function ReactionLayer({ reactions }: { reactions: Reaction[] }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden" aria-live="polite">
      {reactions.map((reaction) => (
        <div
          key={reaction.id}
          className="reaction-float absolute bottom-24 flex flex-col items-center gap-1"
          style={{ left: `${reactionLeftPercent(reaction.id)}%` }}
        >
          <span className="text-5xl">{reaction.emoji}</span>
          <Label className="rounded-full bg-ink-raised px-2 py-0.5 ring-1 ring-mist/15">{reaction.playerName}</Label>
        </div>
      ))}
    </div>
  );
}

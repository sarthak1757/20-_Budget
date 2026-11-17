import { useEffect, useState } from "react";
import { REACTION_COOLDOWN_MS, REACTION_EMOJIS, type Reaction, type ReactionPayload } from "@budget-draft/shared";

// The 5 reaction buttons. They grey out for a second after a click,
// matching the server's limit of one reaction per second.
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
    <div className="flex justify-center gap-2" role="group" aria-label="Send a reaction">
      {REACTION_EMOJIS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          onClick={() => send(emoji)}
          disabled={coolingDown}
          aria-label={`React ${emoji}`}
          className="rounded-full bg-zinc-800 px-3 py-2 text-xl transition hover:bg-zinc-700 active:scale-90 disabled:opacity-40"
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
          className="reaction-float absolute bottom-24 flex flex-col items-center"
          style={{ left: `${reactionLeftPercent(reaction.id)}%` }}
        >
          <span className="text-5xl">{reaction.emoji}</span>
          <span className="rounded-full bg-zinc-900/80 px-2 text-xs text-zinc-300">{reaction.playerName}</span>
        </div>
      ))}
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { HOW_TO_PLAY_CARDS } from "../lib/howToPlay";
import { useHelpStore } from "../store/helpStore";
import { Button } from "./ui";

// The 4 how-to-play cards in a dialog, one at a time.
export function HowToPlay() {
  const open = useHelpStore((store) => store.open);
  const hide = useHelpStore((store) => store.hide);
  const [index, setIndex] = useState(0);
  const nextButton = useRef<HTMLButtonElement>(null);

  // Start from the first card each time, put focus in the dialog, and let Esc close it.
  useEffect(() => {
    if (!open) {
      return;
    }
    setIndex(0);
    nextButton.current?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        hide();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, hide]);

  if (!open) {
    return null;
  }
  const card = HOW_TO_PLAY_CARDS[index];
  if (!card) {
    return null;
  }
  const isLast = index === HOW_TO_PLAY_CARDS.length - 1;

  function next() {
    if (isLast) {
      hide();
    } else {
      setIndex(index + 1);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={hide}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="how-to-play-title"
        className="w-full max-w-sm rounded-3xl border border-zinc-700 bg-zinc-900 p-6 text-center shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <p className="text-xs tracking-widest text-zinc-500 uppercase">How to play</p>
        <div className="my-4 text-6xl" aria-hidden>
          {card.emoji}
        </div>
        <h2 id="how-to-play-title" className="text-2xl font-black">
          {card.title}
        </h2>
        <p className="mt-3 text-zinc-300">{card.text}</p>

        <div className="my-5 flex justify-center gap-2" aria-label={`Card ${index + 1} of ${HOW_TO_PLAY_CARDS.length}`}>
          {HOW_TO_PLAY_CARDS.map((shown, dot) => (
            <span key={shown.title} className={`size-2 rounded-full ${dot === index ? "bg-emerald-400" : "bg-zinc-700"}`} />
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {index === 0 ? (
            <Button variant="ghost" onClick={hide}>
              Skip
            </Button>
          ) : (
            <Button variant="secondary" onClick={() => setIndex(index - 1)}>
              Back
            </Button>
          )}
          <Button ref={nextButton} onClick={next}>
            {isLast ? "Let's play" : "Next"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// The "?" in the header.
export function HelpButton() {
  const show = useHelpStore((store) => store.show);
  return (
    <button
      type="button"
      onClick={show}
      aria-label="How to play"
      title="How to play"
      className="grid size-9 place-items-center rounded-full text-sm font-medium text-platinum ring-1 ring-platinum/60 hover:bg-mocha-light"
    >
      ?
    </button>
  );
}

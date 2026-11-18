import { CircleHelp } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { HOW_TO_PLAY_CARDS } from "../lib/howToPlay";
import { useHelpStore } from "../store/helpStore";
import { ChromeBlob, type ChromeShape } from "./brand/ChromeBlob";
import { ICON_STROKE, Label } from "./brand/primitives";
import { Button } from "./ui";

const BLOB_SHAPES: ChromeShape[] = ["ring", "pebble", "ribbon", "ring"];

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
  const { Icon } = card;

  function next() {
    if (isLast) {
      hide();
    } else {
      setIndex(index + 1);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-mocha-dark/80 p-4" onClick={hide}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="how-to-play-title"
        className="relative isolate w-full max-w-sm overflow-hidden rounded-[2rem] bg-mocha-dark p-7 text-center shadow-2xl ring-1 ring-platinum/30"
        onClick={(event) => event.stopPropagation()}
      >
        {/* A different chrome shape for each card, behind the text. */}
        <ChromeBlob
          shape={BLOB_SHAPES[index % BLOB_SHAPES.length] ?? "ring"}
          className="absolute -top-8 -right-12 -z-10 w-44 opacity-90"
        />
        <Label>
          How to play · {index + 1} / {HOW_TO_PLAY_CARDS.length}
        </Label>
        <Icon size={40} strokeWidth={ICON_STROKE} className="mx-auto mt-10 text-lavender-deep" aria-hidden />
        <h2 id="how-to-play-title" className="display-italic mt-4 text-5xl text-lavender">
          {card.title}
        </h2>
        <p className="mt-4 text-platinum">{card.text}</p>

        <div className="my-6 flex justify-center gap-2" aria-hidden>
          {HOW_TO_PLAY_CARDS.map((shown, dot) => (
            <span key={shown.title} className={`h-px w-8 ${dot === index ? "bg-lavender" : "bg-platinum/30"}`} />
          ))}
        </div>

        <div className="flex items-center justify-between gap-3">
          {index === 0 ? (
            <Button variant="ghost" onClick={hide}>
              Skip
            </Button>
          ) : (
            <Button variant="ghost" onClick={() => setIndex(index - 1)}>
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
      className="grid size-9 place-items-center rounded-full text-platinum ring-1 ring-platinum/60 hover:bg-mocha-light"
    >
      <CircleHelp size={16} strokeWidth={ICON_STROKE} aria-hidden />
    </button>
  );
}

import { ChromeBlob } from "./ChromeBlob";

const WORD_CLASS =
  "display-italic relative z-10 block text-[22vw] leading-[0.8] text-lavender [text-shadow:0_4px_28px_var(--color-mocha-dark)] sm:text-[11rem]";

// "Budget" / "Draft" split around a chrome blob. The blob sits BEHIND the
// letters (z-0) and peeks out to the right, so every letter stays readable.
export function HeroTitle() {
  return (
    <div className="relative">
      <ChromeBlob shape="pebble" className="absolute top-[4%] left-[52%] z-0 w-[44vw] max-w-80 sm:left-[50%]" />
      <h1>
        <span className="sr-only">Budget Draft</span>
        <span aria-hidden className={WORD_CLASS}>
          Budget
        </span>
        <span aria-hidden className={`${WORD_CLASS} pl-[18vw] sm:pl-56`}>
          Draft
        </span>
      </h1>
    </div>
  );
}

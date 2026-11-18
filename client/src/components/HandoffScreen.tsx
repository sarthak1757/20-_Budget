import { Smartphone } from "lucide-react";
import { ICON_STROKE, Label, PillButton } from "./brand/primitives";

interface HandoffScreenProps {
  playerName: string;
  purpose: "turn" | "vote";
  recentActivity: string[];
  onReady: () => void;
}

// Pass-and-play: covers the board until the right person has the phone,
// so nobody acts by accident on someone else's turn.
export function HandoffScreen({ playerName, purpose, recentActivity, onReady }: HandoffScreenProps) {
  return (
    <div className="flex min-h-[70dvh] flex-col items-center justify-center gap-6 text-center">
      {recentActivity.length > 0 && (
        <ul className="text-sm text-platinum">
          {recentActivity.map((line, index) => (
            <li key={index}>{line}</li>
          ))}
        </ul>
      )}
      <Smartphone size={44} strokeWidth={ICON_STROKE} className="text-lavender-deep" aria-hidden />
      <Label>Pass the device to</Label>
      <h1 className="display-italic -mt-2 max-w-full text-6xl break-words text-lavender sm:text-8xl">{playerName}</h1>
      <p className="text-platinum">{purpose === "vote" ? "It's time to vote for the best team." : "It's their turn to buy or pass."}</p>
      <PillButton className="px-8 py-4 text-lg" onClick={onReady} autoFocus>
        I'm {playerName}, show me
      </PillButton>
    </div>
  );
}

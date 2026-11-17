import { Button } from "./ui";

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
        <ul className="text-zinc-400">
          {recentActivity.map((line, index) => (
            <li key={index}>{line}</li>
          ))}
        </ul>
      )}
      <p className="text-5xl" aria-hidden>
        📱
      </p>
      <h1 className="text-3xl font-black sm:text-4xl">
        Pass the device to <span className="text-money">{playerName}</span>
      </h1>
      <p className="text-zinc-400">{purpose === "vote" ? "It's time to vote for the best team." : "It's their turn to buy or pass."}</p>
      <Button className="px-8 py-4 text-lg" onClick={onReady} autoFocus>
        I'm {playerName}, show me
      </Button>
    </div>
  );
}

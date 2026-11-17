import { maxSpendable, type Item, type PlayerState } from "@budget-draft/shared";
import { Avatar } from "./Avatar";

interface PlayerColumnProps {
  player: PlayerState;
  isCurrentTurn: boolean;
  cantAfford: boolean;
  isViewer?: boolean; // online: highlights "you"
}

export function PlayerColumn({ player, isCurrentTurn, cantAfford, isViewer = false }: PlayerColumnProps) {
  const border = isCurrentTurn ? "border-emerald-400 shadow-lg shadow-emerald-500/20" : "border-zinc-800";

  return (
    <section
      aria-label={`${player.name}'s team`}
      className={`flex min-w-0 flex-col rounded-2xl border-2 bg-zinc-900 p-3 transition-colors lg:w-56 ${border}`}
    >
      <header className="flex items-center gap-2">
        <span className="truncate font-bold">
          {player.isBot && <span aria-label="bot">🤖 </span>}
          {player.name}
          {isViewer && <span className="text-zinc-500"> (you)</span>}
        </span>
        {!player.isConnected && <span className="ml-auto text-xs text-amber-400">offline</span>}
      </header>

      <p className="text-money text-4xl font-black tabular-nums sm:text-5xl" aria-label={`Budget $${player.budget}`}>
        ${player.budget}
      </p>
      <p className="mb-2 h-5 text-xs text-zinc-500">
        {cantAfford && <span className="text-amber-400">Can't afford this one</span>}
        {!cantAfford && maxSpendable(player) > 0 && <>Can spend up to ${maxSpendable(player)}</>}
        {!cantAfford && maxSpendable(player) === 0 && <>Team complete</>}
      </p>

      <ol className="grid gap-1.5">
        {player.team.map((item, index) => (
          <Slot key={index} index={index} item={item} />
        ))}
      </ol>
    </section>
  );
}

function Slot({ index, item }: { index: number; item: Item | null }) {
  if (item === null) {
    return (
      <li className="flex h-11 items-center gap-2 rounded-lg border border-dashed border-zinc-700 px-2 text-zinc-600">
        <span className="w-4 text-xs font-bold tabular-nums">{index + 1}</span>
        <span className="text-sm">Empty</span>
      </li>
    );
  }
  return (
    <li
      className={`animate-slot-fill flex h-11 items-center gap-2 rounded-lg px-2 ${item.isBench ? "bg-zinc-800/50 text-zinc-400" : "bg-zinc-800"}`}
      title={`${item.name} · ${item.tag} · $${item.price} · rating ${item.rating}`}
    >
      <span className="w-4 text-xs font-bold text-zinc-500 tabular-nums">{index + 1}</span>
      <Avatar name={item.name} emoji={item.emoji} size="sm" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm leading-tight font-semibold">{item.name}</span>
        <span className="block text-[11px] leading-tight text-zinc-500">
          {item.tag} · ${item.price}
        </span>
      </span>
      <span className="text-sm font-bold tabular-nums">{item.rating}</span>
    </li>
  );
}

import { Bot, Check, Gift } from "lucide-react";
import { findMissingRoles, maxSpendable, pricePaid, type PublicItem, type PublicPlayerState } from "@budget-draft/shared";
import { useAnimatedNumber } from "../lib/useAnimatedNumber";
import { ICON_STROKE, Label, UrgentNote } from "./brand/primitives";

interface PlayerColumnProps {
  player: PublicPlayerState;
  isCurrentTurn: boolean;
  cantAfford: boolean;
  isViewer?: boolean; // online: highlights "you"
  justBought?: boolean; // plays a short glow after this player buys
  isHighBidder?: boolean; // auction: holds the current high bid
  requiredRoles?: string[]; // Balanced team: roles to cover. Empty = not playing it.
}

export function PlayerColumn({
  player,
  isCurrentTurn,
  cantAfford,
  isViewer = false,
  justBought = false,
  isHighBidder = false,
  requiredRoles = [],
}: PlayerColumnProps) {
  const shownBudget = useAnimatedNumber(player.budget);
  // The active player gets a lavender-deep frame and a soft glow; everyone else a hairline.
  const frame = isCurrentTurn ? "shadow-glow" : "ring-1 ring-platinum/30";

  return (
    <section
      aria-label={`${player.name}'s team`}
      className={`flex min-w-0 flex-col gap-3 rounded-[1.75rem] bg-mocha-dark p-4 transition-shadow lg:w-56 ${frame} ${justBought ? "animate-bought" : ""}`}
    >
      <header className="flex min-w-0 items-center gap-2">
        {player.isBot && <Bot size={14} strokeWidth={ICON_STROKE} className="shrink-0 text-lavender-deep" aria-label="bot" />}
        <Label className={`truncate ${isCurrentTurn ? "text-lavender" : ""}`}>
          {player.name}
          {isViewer && " · you"}
        </Label>
        {isHighBidder && <Label className="ml-auto shrink-0 rounded-full bg-lavender-deep px-2 py-0.5 text-mocha-dark">High bid</Label>}
        {!player.isConnected && <Label className="ml-auto shrink-0 text-lavender-deep">Offline</Label>}
      </header>

      <p className="display-italic text-6xl text-lavender tabular-nums sm:text-7xl" aria-label={`Budget $${player.budget}`}>
        ${shownBudget}
      </p>
      <div className="min-h-5">
        {cantAfford && <UrgentNote>Can't afford this one</UrgentNote>}
        {!cantAfford && maxSpendable(player) > 0 && <Label className="text-platinum/80">Can spend up to ${maxSpendable(player)}</Label>}
        {!cantAfford && maxSpendable(player) === 0 && <Label className="text-platinum/80">Team complete</Label>}
      </div>

      <ol className="grid grid-cols-[minmax(0,1fr)]">
        {player.team.map((item, index) => (
          <Slot key={index} index={index} item={item} />
        ))}
      </ol>
      {requiredRoles.length > 0 && <RoleChips team={player.team} requiredRoles={requiredRoles} />}
    </section>
  );
}

// A numbered hairline row that fills in when an item is bought.
function Slot({ index, item }: { index: number; item: PublicItem | null }) {
  if (item === null) {
    return (
      <li className="flex min-h-12 items-center gap-3 border-t border-platinum/30 py-2 last:border-b">
        <Label className="text-platinum/70">Slot {index + 1}</Label>
      </li>
    );
  }
  return (
    <li
      className={`animate-slot-fill flex min-h-12 items-center gap-2 border-t border-platinum/30 py-2 last:border-b ${item.isBench ? "opacity-70" : ""}`}
      title={`${item.name} · ${item.tag} · paid $${pricePaid(item)} (listed $${item.price}) · rating ${item.rating === null ? "hidden" : item.rating}`}
    >
      <Label className="w-5 shrink-0 text-platinum/70">{String(index + 1).padStart(2, "0")}</Label>
      <span className="min-w-0 flex-1">
        <span className="display-italic block truncate text-lg text-lavender">{item.name}</span>
        <Label className="block truncate text-platinum/80">
          <span className="hidden sm:inline">{item.tag} · </span>${pricePaid(item)}
        </Label>
      </span>
      {item.rating === null ? (
        <Gift size={16} strokeWidth={ICON_STROKE} className="shrink-0 text-lavender-deep" aria-label="Rating hidden until the draft ends" />
      ) : (
        <span className="display-italic text-2xl text-lavender tabular-nums">{item.rating}</span>
      )}
    </li>
  );
}

// Balanced team: every role, ticked once the team has one.
function RoleChips({ team, requiredRoles }: { team: (PublicItem | null)[]; requiredRoles: string[] }) {
  const missing = findMissingRoles(team, requiredRoles);
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="Roles for the balanced team bonus">
      {requiredRoles.map((role) => {
        const covered = !missing.includes(role);
        return (
          <li
            key={role}
            className={`label-caps inline-flex items-center gap-1 rounded-full px-2 py-1 ${covered ? "bg-lavender text-mocha" : "text-platinum ring-1 ring-platinum/40 ring-inset"}`}
          >
            {covered && <Check size={11} strokeWidth={2} aria-hidden />}
            {role}
            <span className="sr-only">{covered ? " covered" : " needed"}</span>
          </li>
        );
      })}
    </ul>
  );
}

import type { ReactNode } from "react";
import { getBuyBlockReason, getCurrentPlayerId, type PlayerState, type PublicGameState } from "@budget-draft/shared";
import { describeEvent } from "../lib/describeEvents";
import { ActionBar } from "./ActionBar";
import { ItemCard } from "./ItemCard";
import { PlayerColumn } from "./PlayerColumn";

interface GameBoardProps {
  // PublicGameState for both local and online games: the board never needs
  // the hidden pool, and using one type means one board for every mode.
  state: PublicGameState;
  viewerId: string | null; // online: this device's player. Local: null.
  canAct: boolean;
  busy?: boolean;
  turnLabel: string;
  timer?: ReactNode;
  onBuy: () => void;
  onPass: () => void;
}

export function GameBoard({ state, viewerId, canAct, busy = false, turnLabel, timer, onBuy, onPass }: GameBoardProps) {
  const currentId = getCurrentPlayerId(state);

  // Whose budget decides if BUY is allowed: the viewer online, the current player locally.
  const actingId = viewerId ?? currentId;
  let actingPlayer: PlayerState | undefined;
  for (const player of state.players) {
    if (player.id === actingId) {
      actingPlayer = player;
    }
  }
  let buyBlockReason: string | null = null;
  if (state.currentItem && actingPlayer) {
    buyBlockReason = getBuyBlockReason(actingPlayer, state.currentItem);
  }

  // Split players to the left and right of the item card on wide screens.
  const half = Math.ceil(state.players.length / 2);
  const leftPlayers = state.players.slice(0, half);
  const rightPlayers = state.players.slice(half);

  function renderColumn(player: PlayerState) {
    return (
      <PlayerColumn
        key={player.id}
        player={player}
        isCurrentTurn={player.id === currentId}
        cantAfford={state.cantAffordIds.includes(player.id)}
        isViewer={player.id === viewerId}
      />
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 lg:flex lg:items-start lg:justify-center">
      {leftPlayers.map(renderColumn)}

      <div className="order-first col-span-2 grid gap-3 lg:order-none lg:w-80 lg:shrink-0">
        {state.currentItem && (
          <ItemCard
            key={state.currentItem.id}
            item={state.currentItem}
            roundNumber={state.roundNumber}
            itemsRemaining={state.itemsRemaining}
          />
        )}
        {timer}
        <ActionBar
          turnLabel={turnLabel}
          canAct={canAct}
          busy={busy}
          buyBlockReason={buyBlockReason}
          onBuy={onBuy}
          onPass={onPass}
        />
        <ul className="min-h-10 text-center text-sm text-zinc-400" aria-live="polite">
          {state.lastEvents.map((event, index) => (
            <li key={index}>{describeEvent(event, state.players)}</li>
          ))}
        </ul>
      </div>

      {rightPlayers.map(renderColumn)}
    </div>
  );
}

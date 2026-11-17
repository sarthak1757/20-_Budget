import type { ReactNode } from "react";
import {
  getBuyBlockReason,
  getCurrentPlayerId,
  type PublicPlayerState,
  type PowerUp,
  type PublicGameState,
  type TurnMove,
} from "@budget-draft/shared";
import { describeEvent } from "../lib/describeEvents";
import { isPeekVisible, type PeekedItem } from "../lib/peek";
import { ActionBar } from "./ActionBar";
import { BidBar } from "./BidBar";
import { ItemCard } from "./ItemCard";
import { PlayerColumn } from "./PlayerColumn";
import { PowerUpBar } from "./PowerUpBar";

interface GameBoardProps {
  // PublicGameState for both local and online games: the board never needs
  // the hidden pool, and using one type means one board for every mode.
  state: PublicGameState;
  viewerId: string | null; // online: this device's player. Local: null.
  canAct: boolean;
  busy?: boolean;
  turnLabel: string;
  timer?: ReactNode;
  peeked?: PeekedItem | null;
  onMove: (move: TurnMove) => void;
  onPeek: () => void;
}

function findPlayer(players: PublicPlayerState[], id: string | null): PublicPlayerState | undefined {
  for (const player of players) {
    if (player.id === id) {
      return player;
    }
  }
  return undefined;
}

export function GameBoard({
  state,
  viewerId,
  canAct,
  busy = false,
  turnLabel,
  timer,
  peeked = null,
  onMove,
  onPeek,
}: GameBoardProps) {
  const currentId = getCurrentPlayerId(state);

  // Whose budget decides if BUY/BID is allowed: the viewer online, the current player locally.
  const actingPlayer = findPlayer(state.players, viewerId ?? currentId);
  let buyBlockReason: string | null = null;
  if (state.currentItem && actingPlayer) {
    buyBlockReason = getBuyBlockReason(actingPlayer, state.currentItem);
  }

  // Who bought something in the last action (for the column glow).
  let boughtBy: string | null = null;
  for (const event of state.lastEvents) {
    if (event.type === "bought") {
      boughtBy = event.playerId;
    }
  }

  // Split players to the left and right of the item card on wide screens.
  const half = Math.ceil(state.players.length / 2);
  const leftPlayers = state.players.slice(0, half);
  const rightPlayers = state.players.slice(half);

  function renderColumn(player: PublicPlayerState) {
    return (
      <PlayerColumn
        key={player.id}
        player={player}
        isCurrentTurn={player.id === currentId}
        cantAfford={state.cantAffordIds.includes(player.id)}
        isViewer={player.id === viewerId}
        justBought={boughtBy === player.id}
        isHighBidder={state.auction !== null && state.auction.highBidderId === player.id}
        requiredRoles={state.requiredRoles}
      />
    );
  }

  function handlePowerUp(powerUp: PowerUp) {
    if (powerUp === "peek") {
      onPeek();
    } else {
      onMove({ type: powerUp });
    }
  }

  let controls: ReactNode;
  if (state.auction !== null) {
    const highBidder = findPlayer(state.players, state.auction.highBidderId);
    controls = (
      <BidBar
        turnLabel={turnLabel}
        auction={state.auction}
        highBidderName={highBidder ? highBidder.name : null}
        bidder={actingPlayer}
        canAct={canAct}
        busy={busy}
        onBid={(amount) => onMove({ type: "bid", amount })}
        onPass={() => onMove({ type: "pass" })}
      />
    );
  } else {
    controls = (
      <ActionBar
        turnLabel={turnLabel}
        canAct={canAct}
        busy={busy}
        buyBlockReason={buyBlockReason}
        onBuy={() => onMove({ type: "buy" })}
        onPass={() => onMove({ type: "pass" })}
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
            isAuction={state.auction !== null}
          />
        )}
        {timer}
        {controls}
        <PowerUpBar
          state={state}
          playerId={actingPlayer ? actingPlayer.id : null}
          canAct={canAct}
          busy={busy}
          onUse={handlePowerUp}
        />
        {isPeekVisible(peeked, state.roundNumber, currentId) && <PeekCard peeked={peeked} />}
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

// The next item, as seen with Peek. Only shown to the player who peeked.
function PeekCard({ peeked }: { peeked: PeekedItem }) {
  const item = peeked.item;
  return (
    <div className="rounded-xl border border-violet-700 bg-violet-950/40 p-3 text-sm" aria-live="polite">
      <p className="text-xs text-violet-300 uppercase">👀 Next up (only you can see this)</p>
      <p className="font-bold">{item.name}</p>
      <p className="text-zinc-400">
        {item.tag} · ${item.price} · rating {item.rating === null ? "hidden 🎁" : item.rating}
      </p>
    </div>
  );
}

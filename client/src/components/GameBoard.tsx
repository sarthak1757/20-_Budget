import { Eye } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import {
  getBuyBlockReason,
  getCurrentPlayerId,
  secondsPerTurn,
  type PublicPlayerState,
  type PowerUp,
  type PublicGameState,
  type TurnMove,
} from "@budget-draft/shared";
import { describeEvent } from "../lib/describeEvents";
import { useIsPhone } from "../lib/useMediaQuery";
import { isPeekVisible, type PeekedItem } from "../lib/peek";
import { useGameSounds } from "../lib/useGameSounds";
import { buzz } from "../store/soundStore";
import { ICON_STROKE, Label } from "./brand/primitives";
import { ActionBar } from "./ActionBar";
import { BidBar } from "./BidBar";
import { Countdown } from "./Countdown";
import { ItemCard } from "./ItemCard";
import { MyTeamBar, OpponentStrip, type PlayerBadges } from "./PhoneBoardParts";
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

// Whose team sits in the phone's bottom bar as "yours".
// Online: this device's player. Solo vs bots: the one human.
// Pass and play: whoever holds the phone, which is the current player.
export function findSelfId(players: PublicPlayerState[], viewerId: string | null, currentId: string | null): string | null {
  if (viewerId !== null) {
    return viewerId;
  }
  let human: PublicPlayerState | undefined;
  let humanCount = 0;
  for (const player of players) {
    if (!player.isBot) {
      human = player;
      humanCount += 1;
    }
  }
  if (humanCount === 1 && human) {
    return human.id;
  }
  return currentId;
}

export function GameBoard({ state, viewerId, canAct, busy = false, turnLabel, peeked = null, onMove, onPeek }: GameBoardProps) {
  useGameSounds(state);
  const isPhone = useIsPhone();
  const currentId = getCurrentPlayerId(state);

  // Whose budget decides if BUY/BID is allowed: the viewer online, the current player locally.
  const actingPlayer = findPlayer(state.players, viewerId ?? currentId);
  let buyBlockReason: string | null = null;
  if (state.currentItem && actingPlayer) {
    buyBlockReason = getBuyBlockReason(actingPlayer, state.currentItem);
  }

  // Who bought something in the last action (for the glow).
  let boughtBy: string | null = null;
  for (const event of state.lastEvents) {
    if (event.type === "bought") {
      boughtBy = event.playerId;
    }
  }

  const badges: PlayerBadges = {
    currentId,
    boughtBy,
    highBidderId: state.auction === null ? null : state.auction.highBidderId,
    cantAffordIds: state.cantAffordIds,
    requiredRoles: state.requiredRoles,
  };

  // A small buzz on phones when you commit money.
  function move(next: TurnMove) {
    if (next.type === "buy" || next.type === "bid" || next.type === "discount") {
      buzz("tap");
    }
    onMove(next);
  }

  function handlePowerUp(powerUp: PowerUp) {
    if (powerUp === "peek") {
      onPeek();
    } else {
      move({ type: powerUp });
    }
  }

  let controls: ReactNode;
  if (state.auction !== null) {
    const highBidder = findPlayer(state.players, state.auction.highBidderId);
    controls = (
      <BidBar
        auction={state.auction}
        highBidderName={highBidder ? highBidder.name : null}
        bidder={actingPlayer}
        canAct={canAct}
        busy={busy}
        compact={isPhone}
        onBid={(amount) => move({ type: "bid", amount })}
        onPass={() => move({ type: "pass" })}
      />
    );
  } else {
    controls = (
      <ActionBar
        canAct={canAct}
        busy={busy}
        buyBlockReason={buyBlockReason}
        onBuy={() => move({ type: "buy" })}
        onPass={() => move({ type: "pass" })}
      />
    );
  }

  const powerUps = (
    <PowerUpBar
      state={state}
      playerId={actingPlayer ? actingPlayer.id : null}
      canAct={canAct}
      busy={busy}
      compact={isPhone}
      onUse={handlePowerUp}
    />
  );

  const itemCard = state.currentItem && (
    <ItemCard
      key={state.currentItem.id}
      item={state.currentItem}
      roundNumber={state.roundNumber}
      itemsRemaining={state.itemsRemaining}
      isAuction={state.auction !== null}
    />
  );

  const extras = (
    <>
      {isPeekVisible(peeked, state.roundNumber, currentId) && <PeekCard peeked={peeked} />}
      <ul className="min-h-10 text-center text-sm text-mist" aria-live="polite">
        {state.lastEvents.map((event, index) => (
          <li key={index}>{describeEvent(event, state.players)}</li>
        ))}
      </ul>
    </>
  );

  if (isPhone) {
    const selfId = findSelfId(state.players, viewerId, currentId);
    const self = findPlayer(state.players, selfId);
    const others: PublicPlayerState[] = [];
    for (const player of state.players) {
      if (player.id !== selfId) {
        others.push(player);
      }
    }
    let teamTitle = "Your team";
    if (self && viewerId === null && others.length > 0 && !others.every((p) => p.isBot)) {
      teamTitle = `${self.name}'s team`; // pass and play: the phone changes hands
    }

    return (
      <div className="grid grid-cols-[minmax(0,1fr)] gap-3">
        <OpponentStrip players={others} badges={badges} />
        {itemCard}
        {extras}
        <BottomDock>
          {self && <MyTeamBar key={self.id} player={self} title={teamTitle} badges={badges} />}
          <TurnLine label={turnLabel} highlight={canAct}>
            <Countdown deadline={state.turnDeadline} totalSeconds={secondsPerTurn(state.settings)} label="Time left" variant="compact" />
          </TurnLine>
          {controls}
          {powerUps}
        </BottomDock>
      </div>
    );
  }

  // Wide screens: players to the left and right of the item card.
  const half = Math.ceil(state.players.length / 2);
  function renderColumn(player: PublicPlayerState) {
    return (
      <PlayerColumn
        key={player.id}
        player={player}
        isCurrentTurn={player.id === currentId}
        cantAfford={state.cantAffordIds.includes(player.id)}
        isViewer={player.id === viewerId}
        justBought={boughtBy === player.id}
        isHighBidder={player.id === badges.highBidderId}
        requiredRoles={state.requiredRoles}
      />
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 lg:flex lg:items-start lg:justify-center">
      {state.players.slice(0, half).map(renderColumn)}

      <div className="order-first col-span-2 grid gap-3 lg:order-none lg:w-80 lg:shrink-0">
        {itemCard}
        <Countdown deadline={state.turnDeadline} totalSeconds={secondsPerTurn(state.settings)} label="Time left" />
        <TurnLine label={turnLabel} highlight={canAct} centered />
        {controls}
        {powerUps}
        {extras}
      </div>

      {state.players.slice(half).map(renderColumn)}
    </div>
  );
}

// "It's your turn" in big gold serif when you can act; a quiet label otherwise.
function TurnLine({ label, highlight, centered = false, children }: { label: string; highlight: boolean; centered?: boolean; children?: ReactNode }) {
  return (
    <div className={`flex min-h-8 items-center gap-3 ${centered ? "justify-center text-center" : "justify-between"}`} aria-live="polite">
      {highlight ? (
        <p className="display-serif text-2xl text-gold">{label}</p>
      ) : (
        <p>
          <Label>{label}</Label>
        </p>
      )}
      {children}
    </div>
  );
}

// The phone's thumb zone: pinned to the bottom of the screen, above the
// home indicator. Its height is published as --dock-height so the page can
// add that much space at the bottom and nothing ends up hidden behind it.
// Very short screens (a phone on its side) get it back in the page flow.
function BottomDock({ children }: { children: ReactNode }) {
  const dockRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const dock = dockRef.current;
    if (dock === null) {
      return;
    }
    const root = document.documentElement;
    function publishHeight() {
      if (dock === null) {
        return;
      }
      const pinned = getComputedStyle(dock).position === "fixed";
      root.style.setProperty("--dock-height", pinned ? `${dock.offsetHeight}px` : "0px");
    }
    publishHeight();
    const observer = new ResizeObserver(publishHeight);
    observer.observe(dock);
    window.addEventListener("resize", publishHeight);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", publishHeight);
      root.style.removeProperty("--dock-height");
    };
  }, []);

  return (
    <section
      ref={dockRef}
      aria-label="Your move"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-mist/15 bg-ink/95 px-4 pt-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] backdrop-blur [@media(max-height:500px)]:static [@media(max-height:500px)]:-mx-4 [@media(max-height:500px)]:border-t-0 [@media(max-height:500px)]:bg-transparent"
    >
      <div className="mx-auto grid max-w-xl grid-cols-[minmax(0,1fr)] gap-2.5">{children}</div>
    </section>
  );
}

// The next item, as seen with Peek. Only shown to the player who peeked.
function PeekCard({ peeked }: { peeked: PeekedItem }) {
  const item = peeked.item;
  return (
    <div className="grid gap-1 rounded-[1.25rem] bg-ink-raised p-4 ring-1 ring-gold" aria-live="polite">
      <Label className="flex items-center gap-2 text-gold">
        <Eye size={14} strokeWidth={ICON_STROKE} aria-hidden />
        Next up · only you can see this
      </Label>
      <p className="display-serif text-3xl text-ivory">{item.name}</p>
      <Label className="text-mist">
        {item.tag} · ${item.price} · rating {item.rating === null ? "hidden" : item.rating}
      </Label>
    </div>
  );
}

import { useState } from "react";
import { MAX_PLAYERS, MAX_SLOTS, MIN_SLOTS, type Category, type RoomSnapshot } from "@budget-draft/shared";
import { Avatar } from "./Avatar";
import { RulesPanel } from "./RulesPanel";
import { Stepper } from "./Stepper";
import { INPUT_CLASS, Label, PillButton } from "./brand/primitives";
import { Button, Card, CardTitle } from "./ui";

interface LobbyViewProps {
  room: RoomSnapshot;
  playerId: string | null;
  categories: Category[];
  busy: boolean;
  onChangeSettings: (settings: RoomSnapshot["settings"]) => void;
  onStart: () => void;
  onLeave: () => void;
}

export function LobbyView({ room, playerId, categories, busy, onChangeSettings, onStart, onLeave }: LobbyViewProps) {
  const [copied, setCopied] = useState(false);
  const isHost = room.hostId !== null && room.hostId === playerId;
  const connectedCount = room.players.filter((player) => player.isConnected).length;
  const inviteLink = `${window.location.origin}/join/${room.code}`;
  const settings = room.settings;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be blocked (e.g. plain http on a phone). Show the link instead.
      window.prompt("Copy this link:", inviteLink);
    }
  }

  const category = categories.find((c) => c.slug === settings.categorySlug);

  return (
    <div className="mx-auto grid max-w-xl gap-4">
      <Card className="grid justify-items-center gap-4 text-center">
        <Label>Room code</Label>
        <p className="display-italic max-w-full text-6xl tracking-[0.08em] text-lavender sm:text-8xl sm:tracking-[0.12em]">{room.code}</p>
        <Button variant="secondary" onClick={copyLink} className="w-full">
          {copied ? "✓ Link copied" : "Copy invite link"}
        </Button>
      </Card>

      <Card className="grid gap-5">
        <CardTitle>
          Players ({room.players.length}/{MAX_PLAYERS})
        </CardTitle>
        <ul className="grid gap-4">
          {room.players.map((player) => (
            <li key={player.id} className="flex items-center gap-3">
              <Avatar name={player.name} />
              <span className="display-italic text-2xl text-lavender">{player.name}</span>
              {player.id === playerId && <Label className="text-platinum/80">You</Label>}
              {player.isHost && <Label className="text-lavender-deep">Host</Label>}
              <span
                className={`ml-auto size-2.5 rounded-full ${player.isConnected ? "bg-lavender" : "ring-1 ring-platinum/60"}`}
                aria-label={player.isConnected ? "online" : "offline"}
              />
            </li>
          ))}
        </ul>
        {room.players.length < 2 && <p className="mt-4 text-sm text-platinum">Waiting for at least one more player…</p>}
      </Card>

      <Card className="grid gap-5">
        <CardTitle>Settings{!isHost && " · host decides"}</CardTitle>
        {room.customItemCount !== null ? (
          <p className="flex items-baseline justify-between gap-4">
            <Label>Category</Label>
            <span className="display-italic text-2xl text-lavender">Custom list · {room.customItemCount} items</span>
          </p>
        ) : isHost ? (
          <label className="flex items-center justify-between gap-4">
            <Label>Category</Label>
            <select
              value={settings.categorySlug}
              onChange={(event) => onChangeSettings({ ...settings, categorySlug: event.target.value })}
              disabled={busy}
              className={`${INPUT_CLASS} w-auto bg-mocha-dark`}
            >
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.emoji} {c.name}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <p className="flex items-baseline justify-between gap-4">
            <Label>Category</Label>
            <span className="display-italic text-2xl text-lavender">
              {category ? `${category.emoji} ${category.name}` : settings.categorySlug}
            </span>
          </p>
        )}
        <Stepper
          label="Budget"
          value={settings.startingBudget}
          min={5}
          max={50}
          format={(v) => `$${v}`}
          disabled={!isHost || busy}
          onChange={(value) => onChangeSettings({ ...settings, startingBudget: value })}
        />
        <Stepper
          label="Slots"
          value={settings.slotCount}
          min={MIN_SLOTS}
          max={MAX_SLOTS}
          disabled={!isHost || busy}
          onChange={(value) => onChangeSettings({ ...settings, slotCount: value })}
        />
        <RulesPanel
          settings={settings}
          categoryRoles={category ? category.roles : []}
          disabled={!isHost || busy}
          onChange={onChangeSettings}
        />
        <p className="text-sm text-platinum">
          {settings.turnSeconds}s per {settings.draftStyle === "auction" ? "bid" : "turn"}. If time runs out, you pass.
        </p>
      </Card>

      {isHost ? (
        <PillButton className="py-4 text-lg" disabled={busy || connectedCount < 2} onClick={onStart}>
          Start game
        </PillButton>
      ) : (
        <p className="text-center">
          <Label>Waiting for the host to start…</Label>
        </p>
      )}
      <Button variant="ghost" onClick={onLeave}>
        Leave room
      </Button>
    </div>
  );
}

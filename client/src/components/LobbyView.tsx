import { useState } from "react";
import { MAX_PLAYERS, MAX_SLOTS, MIN_SLOTS, type Category, type RoomSnapshot } from "@budget-draft/shared";
import { Avatar } from "./Avatar";
import { RulesPanel } from "./RulesPanel";
import { Stepper } from "./Stepper";
import { Button, Card } from "./ui";

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
      <Card className="text-center">
        <p className="text-sm text-zinc-400 uppercase">Room code</p>
        <p className="my-2 font-mono text-5xl font-black tracking-[0.2em]">{room.code}</p>
        <Button variant="secondary" onClick={copyLink} className="w-full">
          {copied ? "✓ Link copied" : "Copy invite link"}
        </Button>
      </Card>

      <Card>
        <h2 className="mb-3 font-bold">
          Players ({room.players.length}/{MAX_PLAYERS})
        </h2>
        <ul className="grid gap-2">
          {room.players.map((player) => (
            <li key={player.id} className="flex items-center gap-3">
              <Avatar name={player.name} />
              <span className="font-semibold">{player.name}</span>
              {player.id === playerId && <span className="text-sm text-zinc-500">(you)</span>}
              {player.isHost && <span title="Host">👑</span>}
              <span
                className={`ml-auto size-2.5 rounded-full ${player.isConnected ? "bg-emerald-400" : "bg-zinc-600"}`}
                aria-label={player.isConnected ? "online" : "offline"}
              />
            </li>
          ))}
        </ul>
        {room.players.length < 2 && <p className="mt-3 text-sm text-zinc-500">Waiting for at least one more player…</p>}
      </Card>

      <Card className="grid gap-3">
        <h2 className="font-bold">Settings {!isHost && <span className="font-normal text-zinc-500">(host decides)</span>}</h2>
        {room.customItemCount !== null ? (
          <p className="flex justify-between">
            <span className="text-zinc-300">Category</span>
            <span>✏️ Custom list ({room.customItemCount} items)</span>
          </p>
        ) : isHost ? (
          <label className="flex items-center justify-between gap-4">
            <span className="text-zinc-300">Category</span>
            <select
              value={settings.categorySlug}
              onChange={(event) => onChangeSettings({ ...settings, categorySlug: event.target.value })}
              disabled={busy}
              className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2"
            >
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.emoji} {c.name}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <p className="flex justify-between">
            <span className="text-zinc-300">Category</span>
            <span>{category ? `${category.emoji} ${category.name}` : settings.categorySlug}</span>
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
        <p className="text-sm text-zinc-500">
          {settings.turnSeconds}s per {settings.draftStyle === "auction" ? "bid" : "turn"}. If time runs out, you pass.
        </p>
      </Card>

      {isHost ? (
        <Button className="py-4 text-lg" disabled={busy || connectedCount < 2} onClick={onStart}>
          Start game
        </Button>
      ) : (
        <p className="text-center text-zinc-400">Waiting for the host to start…</p>
      )}
      <Button variant="ghost" onClick={onLeave}>
        Leave room
      </Button>
    </div>
  );
}

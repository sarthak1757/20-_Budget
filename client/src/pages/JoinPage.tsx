import { useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router";
import { playerNameSchema, roomCodeSchema, type RoomInfo } from "@budget-draft/shared";
import { NameField } from "../components/NameField";
import { Button, Card, PageShell } from "../components/ui";
import { apiRequest } from "../lib/api";
import { getStoredName, getStoredPlayerId, storeName } from "../lib/playerStorage";

// Reached from the home page (/join) or an invite link (/join/ABC123).
export function JoinPage() {
  const navigate = useNavigate();
  const [code, setCode] = useState(useParams().code ?? "");
  const [name, setName] = useState(getStoredName);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const parsedCode = roomCodeSchema.safeParse(code);
    if (!parsedCode.success) {
      setError("Room codes are 6 letters or digits");
      return;
    }
    const parsedName = playerNameSchema.safeParse(name);
    if (!parsedName.success) {
      setError("Enter a name (1–20 characters)");
      return;
    }

    setChecking(true);
    setError(null);
    try {
      // Check before connecting so we can give a clear message.
      const info = await apiRequest<RoomInfo>(`/api/rooms/${parsedCode.data}`);
      const isReturning = getStoredPlayerId(parsedCode.data) !== undefined;
      if (!info.joinable && !isReturning) {
        setError(info.phase === "lobby" ? "That room is full" : "That game has already started");
        setChecking(false);
        return;
      }
      storeName(parsedName.data);
      navigate(`/room/${parsedCode.data}`);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Couldn't find that room");
      setChecking(false);
    }
  }

  return (
    <PageShell title="Join a room" backTo="/">
      <form onSubmit={handleSubmit} className="mx-auto grid max-w-md gap-4">
        <Card className="grid gap-4">
          <label className="grid gap-1">
            <span className="text-sm text-zinc-400">Room code</span>
            <input
              value={code}
              onChange={(event) => setCode(event.target.value.toUpperCase())}
              maxLength={6}
              autoCapitalize="characters"
              autoComplete="off"
              placeholder="ABC123"
              className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-3 font-mono text-2xl tracking-[0.3em] uppercase outline-none focus:border-emerald-500"
            />
          </label>
          <NameField value={name} onChange={setName} />
        </Card>
        {error && (
          <p role="alert" className="text-rose-400">
            {error}
          </p>
        )}
        <Button type="submit" disabled={checking} className="py-4 text-lg">
          {checking ? "Checking…" : "Join"}
        </Button>
      </form>
    </PageShell>
  );
}

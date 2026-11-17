import { useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router";
import { playerNameSchema, type CreateRoomResponse } from "@budget-draft/shared";
import { NameField } from "../components/NameField";
import { Button, Card, PageShell } from "../components/ui";
import { apiRequest } from "../lib/api";
import { getStoredName, storeName } from "../lib/playerStorage";

export function CreateRoomPage() {
  const categorySlug = useParams().categorySlug ?? "";
  const navigate = useNavigate();
  const [name, setName] = useState(getStoredName);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const parsedName = playerNameSchema.safeParse(name);
    if (!parsedName.success) {
      setError("Enter a name (1–20 characters)");
      return;
    }
    setCreating(true);
    setError(null);
    try {
      const room = await apiRequest<CreateRoomResponse>("/api/rooms", { method: "POST", body: { categorySlug } });
      storeName(parsedName.data);
      navigate(`/room/${room.code}`);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Couldn't create the room");
      setCreating(false);
    }
  }

  return (
    <PageShell title="Create a room" backTo="/new/online">
      <form onSubmit={handleSubmit} className="mx-auto grid max-w-md gap-4">
        <Card className="grid gap-4">
          <NameField value={name} onChange={setName} />
          <p className="text-sm text-zinc-500">You'll get a 6-letter code to share. You can change the rules in the lobby.</p>
        </Card>
        {error && (
          <p role="alert" className="text-rose-400">
            {error}
          </p>
        )}
        <Button type="submit" disabled={creating} className="py-4 text-lg">
          {creating ? "Creating…" : "Create room"}
        </Button>
      </form>
    </PageShell>
  );
}

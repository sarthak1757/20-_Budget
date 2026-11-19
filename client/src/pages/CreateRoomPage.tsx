import { useRef, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router";
import { CUSTOM_CATEGORY_SLUG, parseCustomItems, playerNameSchema, type CreateRoomResponse } from "@budget-draft/shared";
import { CustomListField } from "../components/CustomListField";
import { UrgentNote } from "../components/brand/primitives";
import { NameField } from "../components/NameField";
import { Sheet } from "../components/Sheet";
import { Button, Card, PageShell } from "../components/ui";
import { apiRequest } from "../lib/api";
import { getStoredName, storeName } from "../lib/playerStorage";

export function CreateRoomPage() {
  const categorySlug = useParams().categorySlug ?? "";
  const navigate = useNavigate();
  const [name, setName] = useState(getStoredName);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const isCustom = categorySlug === CUSTOM_CATEGORY_SLUG;
  const [customText, setCustomText] = useState("");
  const [listErrors, setListErrors] = useState<string[]>([]);
  const [showingListErrors, setShowingListErrors] = useState(false);
  const listRef = useRef<HTMLTextAreaElement>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const parsedName = playerNameSchema.safeParse(name);
    if (!parsedName.success) {
      setError("Enter a name (1–20 characters)");
      return;
    }
    let body: { categorySlug: string; customItems?: unknown } = { categorySlug };
    if (isCustom) {
      const parsedList = parseCustomItems(customText);
      if (!parsedList.ok) {
        setListErrors(parsedList.errors);
        setError("Fix the list first");
        // The list can be long and the keyboard covers half a phone screen,
        // so the problems open in a sheet you can't miss.
        setShowingListErrors(true);
        return;
      }
      setListErrors([]);
      body = { categorySlug, customItems: parsedList.items };
    }
    setCreating(true);
    setError(null);
    try {
      const room = await apiRequest<CreateRoomResponse>("/api/rooms", { method: "POST", body });
      storeName(parsedName.data);
      navigate(`/room/${room.code}`);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Couldn't create the room");
      setCreating(false);
    }
  }

  return (
    <PageShell title={isCustom ? "Create a room with your own list" : "Create a room"} backTo="/new/online">
      <form onSubmit={handleSubmit} className="grid max-w-md gap-4">
        <Card className="grid gap-4">
          <NameField value={name} onChange={setName} />
          <p className="text-sm text-mist">You'll get a 6-letter code to share. You can change the rules in the lobby.</p>
        </Card>
        {isCustom && <CustomListField ref={listRef} value={customText} onChange={setCustomText} errors={listErrors} />}
        {error && (
          <p role="alert">
            <UrgentNote>{error}</UrgentNote>
          </p>
        )}
        <Button type="submit" disabled={creating} className="py-4 text-lg">
          {creating ? "Creating…" : "Create room"}
        </Button>
      </form>
      <Sheet open={showingListErrors} onClose={() => setShowingListErrors(false)} title="Your list">
        <p className="display-serif text-4xl text-ivory">
          {listErrors.length === 1 ? "1 line needs fixing" : `${listErrors.length} lines need fixing`}
        </p>
        <ul className="grid gap-2">
          {listErrors.slice(0, 20).map((message) => (
            <li key={message}>
              <UrgentNote>{message}</UrgentNote>
            </li>
          ))}
          {listErrors.length > 20 && <li className="text-sm text-mist">…and {listErrors.length - 20} more</li>}
        </ul>
        <Button
          onClick={() => {
            setShowingListErrors(false);
            listRef.current?.focus();
          }}
        >
          Fix the list
        </Button>
      </Sheet>
    </PageShell>
  );
}

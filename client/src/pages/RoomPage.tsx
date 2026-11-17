import { useEffect } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router";
import { getCurrentPlayerId, type PublicPlayerState, type RoomSnapshot } from "@budget-draft/shared";
import { Countdown } from "../components/Countdown";
import { GameBoard } from "../components/GameBoard";
import { LobbyView } from "../components/LobbyView";
import { ResultsView } from "../components/ResultsView";
import { Button, ErrorBox, PageShell, Spinner } from "../components/ui";
import { VotePanel } from "../components/VotePanel";
import { fetchCategories } from "../lib/categories";
import { getStoredName } from "../lib/playerStorage";
import { useAsync } from "../lib/useAsync";
import { useOnlineStore } from "../store/onlineStore";

export function RoomPage() {
  const code = (useParams().code ?? "").toUpperCase();
  const navigate = useNavigate();
  const name = getStoredName();
  const store = useOnlineStore();
  const categories = useAsync(fetchCategories, []);
  const enterRoom = store.enterRoom;
  const currentCode = store.code;

  // Connect and join when we arrive. We deliberately don't leave on unmount:
  // only the Leave button leaves, so an accidental back-swipe keeps your seat.
  useEffect(() => {
    if (name !== "" && currentCode !== code) {
      enterRoom(code, name);
    }
  }, [code, name, currentCode, enterRoom]);

  if (name === "") {
    // Opened a room link without a name yet: ask for one first.
    return <Navigate to={`/join/${code}`} replace />;
  }

  async function handleLeave() {
    await store.leaveRoom();
    navigate("/");
  }

  if (store.joinError !== null) {
    return (
      <PageShell title="Couldn't join" backTo="/">
        <ErrorBox message={store.joinError} />
        <Link to="/join" className="mt-4 inline-block text-emerald-400 underline">
          Try another code
        </Link>
      </PageShell>
    );
  }

  const room = store.room;
  if (room === null || store.code !== code) {
    return (
      <PageShell>
        <Spinner label="Joining room…" />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <RoomContent
        room={room}
        playerId={store.playerId}
        categories={categories.status === "ready" ? categories.data : []}
        busy={store.busy}
        onLeave={handleLeave}
      />
      {store.actionError && (
        <p role="alert" className="mt-4 text-center text-rose-400">
          {store.actionError}
        </p>
      )}
    </PageShell>
  );
}

interface RoomContentProps {
  room: RoomSnapshot;
  playerId: string | null;
  categories: Awaited<ReturnType<typeof fetchCategories>>;
  busy: boolean;
  onLeave: () => void;
}

function RoomContent({ room, playerId, categories, busy, onLeave }: RoomContentProps) {
  const store = useOnlineStore();
  const game = room.game;

  if (game === null) {
    return (
      <LobbyView
        room={room}
        playerId={playerId}
        categories={categories}
        busy={busy}
        onChangeSettings={store.updateSettings}
        onStart={store.startGame}
        onLeave={onLeave}
      />
    );
  }

  const me: PublicPlayerState | undefined = game.players.find((player) => player.id === playerId);

  if (game.phase === "finished") {
    const isHost = room.hostId === playerId;
    return (
      <>
        <h1 className="mb-6 text-3xl font-black">Results</h1>
        {room.results ? <ResultsView players={game.players} results={room.results} /> : <Spinner />}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {isHost && (
            <Button onClick={store.rematch} disabled={busy}>
              🔁 Rematch
            </Button>
          )}
          <Button variant={isHost ? "secondary" : "primary"} onClick={onLeave}>
            Back to home
          </Button>
        </div>
        {!isHost && <p className="mt-3 text-center text-sm text-zinc-400">The host can start a rematch with everyone here.</p>}
      </>
    );
  }

  if (game.phase === "voting") {
    if (!me) {
      return <p className="text-center text-zinc-400">The players are voting…</p>;
    }
    return (
      <VotePanel
        voterId={me.id}
        voterName={me.name}
        players={game.players}
        selectedId={game.votes[me.id]}
        disabled={busy}
        timer={<Countdown deadline={game.voteDeadline} totalSeconds={game.settings.voteSeconds} label="Voting closes in" />}
        onVote={store.vote}
      />
    );
  }

  const currentId = getCurrentPlayerId(game);
  const current = game.players.find((player) => player.id === currentId);
  const isMyTurn = currentId !== null && currentId === playerId;
  let turnLabel = "";
  if (isMyTurn) {
    turnLabel = game.auction === null ? "Your turn! Buy or pass?" : "Your turn! Bid or pass?";
  } else if (current) {
    turnLabel = `Waiting for ${current.name}…`;
  }

  return (
    <>
      <GameBoard
        state={game}
        viewerId={playerId}
        canAct={isMyTurn}
        busy={busy}
        turnLabel={turnLabel}
        timer={<Countdown deadline={game.turnDeadline} totalSeconds={game.settings.turnSeconds} label="Time left" />}
        onMove={store.act}
        peeked={store.peeked}
        onPeek={store.peek}
      />
      <div className="mt-6 text-center">
        <Button variant="ghost" className="text-sm" onClick={onLeave}>
          Leave game
        </Button>
      </div>
    </>
  );
}

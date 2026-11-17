import { Navigate, useNavigate } from "react-router";
import { getCurrentPlayerId, toPublicState, type PlayerState } from "@budget-draft/shared";
import { GameBoard } from "../components/GameBoard";
import { HandoffScreen } from "../components/HandoffScreen";
import { Button, PageShell } from "../components/ui";
import { VotePanel } from "../components/VotePanel";
import { describeEvent } from "../lib/describeEvents";
import { needsHandoff, whoNeedsDevice } from "../lib/handoff";
import { useLocalGameStore } from "../store/localGameStore";

function findPlayer(players: PlayerState[], id: string | null): PlayerState | undefined {
  for (const player of players) {
    if (player.id === id) {
      return player;
    }
  }
  return undefined;
}

export function LocalGamePage() {
  const navigate = useNavigate();
  const game = useLocalGameStore((store) => store.game);
  const deviceHolderId = useLocalGameStore((store) => store.deviceHolderId);
  const error = useLocalGameStore((store) => store.error);
  const act = useLocalGameStore((store) => store.act);
  const vote = useLocalGameStore((store) => store.vote);
  const confirmHandoff = useLocalGameStore((store) => store.confirmHandoff);
  const reset = useLocalGameStore((store) => store.reset);

  if (!game) {
    return <Navigate to="/" replace />;
  }
  if (game.phase === "finished") {
    return <Navigate to="/results" replace />;
  }

  function handleQuit() {
    if (window.confirm("Quit this game? Progress will be lost.")) {
      reset();
      navigate("/");
    }
  }

  const quitButton = (
    <Button variant="ghost" className="text-sm" onClick={handleQuit}>
      Quit game
    </Button>
  );

  const nextHolder = findPlayer(game.players, whoNeedsDevice(game));
  if (nextHolder && needsHandoff(game, deviceHolderId)) {
    const activity: string[] = [];
    for (const event of game.lastEvents) {
      activity.push(describeEvent(event, game.players));
    }
    return (
      <PageShell>
        <HandoffScreen
          playerName={nextHolder.name}
          purpose={game.phase === "voting" ? "vote" : "turn"}
          recentActivity={activity}
          onReady={confirmHandoff}
        />
        <div className="text-center">{quitButton}</div>
      </PageShell>
    );
  }

  if (game.phase === "voting") {
    const voter = findPlayer(game.players, whoNeedsDevice(game));
    if (!voter) {
      return <Navigate to="/results" replace />;
    }
    return (
      <PageShell>
        <VotePanel voterId={voter.id} voterName={voter.name} players={game.players} onVote={vote} />
        {error && <p className="mt-4 text-center text-rose-400">{error}</p>}
      </PageShell>
    );
  }

  const currentPlayer = findPlayer(game.players, getCurrentPlayerId(game));
  const turnLabel = currentPlayer ? `${currentPlayer.name}'s turn` : "";

  return (
    <PageShell>
      <GameBoard
        state={toPublicState(game)}
        viewerId={null}
        canAct={currentPlayer !== undefined && !currentPlayer.isBot}
        turnLabel={turnLabel}
        onBuy={() => act("buy")}
        onPass={() => act("pass")}
      />
      {error && <p className="mt-4 text-center text-rose-400">{error}</p>}
      <div className="mt-6 text-center">{quitButton}</div>
    </PageShell>
  );
}

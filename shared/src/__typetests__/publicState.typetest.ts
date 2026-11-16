// Compile-time checks, run by `tsc --noEmit` (part of `npm test`).
// Each @ts-expect-error line MUST fail to compile. If someone weakens
// PublicGameState so the full state is accepted, tsc reports an
// "unused @ts-expect-error" and the test run fails.
import type { GameState, PublicGameState } from "../types/game";
import type { ServerToClientEvents } from "../types/socket";
import { toPublicState } from "../game/publicState";

declare const fullState: GameState;
declare const emit: <E extends keyof ServerToClientEvents>(
  event: E,
  ...args: Parameters<ServerToClientEvents[E]>
) => void;

// @ts-expect-error: a full GameState (with itemPool) is not a PublicGameState
export const leaked: PublicGameState = { ...fullState, itemsRemaining: 0 };

// @ts-expect-error: the server can't emit the full state to clients
emit("game:state", fullState);

// @ts-expect-error: not even with itemsRemaining added
emit("game:state", { ...fullState, itemsRemaining: 0 });

// The correct way compiles fine.
emit("game:state", toPublicState(fullState));

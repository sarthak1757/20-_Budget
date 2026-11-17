import { Navigate, useParams } from "react-router";
import { parseMode } from "../lib/modes";
import { CreateRoomPage } from "./CreateRoomPage";
import { SetupPage } from "./SetupPage";

// /new/:mode/:categorySlug: local and bot games share a setup screen; online creates a room.
export function NewGamePage() {
  const mode = parseMode(useParams().mode);
  if (mode === "local" || mode === "bot") {
    return <SetupPage />;
  }
  if (mode === "online") {
    return <CreateRoomPage />;
  }
  return <Navigate to="/" replace />;
}

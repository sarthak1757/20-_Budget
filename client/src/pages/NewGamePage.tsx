import { Navigate, useParams } from "react-router";
import { parseMode } from "../lib/modes";
import { CreateRoomPage } from "./CreateRoomPage";
import { SetupPage } from "./SetupPage";

// /new/:mode/:categorySlug: each mode has its own setup screen.
export function NewGamePage() {
  const mode = parseMode(useParams().mode);
  if (mode === "local") {
    return <SetupPage />;
  }
  if (mode === "online") {
    return <CreateRoomPage />;
  }
  return <Navigate to="/" replace />;
}

import { Link, Route, Routes } from "react-router";
import { Toaster } from "./components/Toaster";
import { PageShell } from "./components/ui";
import { AdminPage } from "./pages/AdminPage";
import { CategoryPickerPage } from "./pages/CategoryPickerPage";
import { DailyPage } from "./pages/DailyPage";
import { HomePage } from "./pages/HomePage";
import { LocalGamePage } from "./pages/LocalGamePage";
import { LocalResultsPage } from "./pages/LocalResultsPage";
import { JoinPage } from "./pages/JoinPage";
import { LeaderboardPage } from "./pages/LeaderboardPage";
import { NewGamePage } from "./pages/NewGamePage";
import { RoomPage } from "./pages/RoomPage";

export function App() {
  return (
    <>
      <Toaster />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/new/:mode" element={<CategoryPickerPage />} />
        <Route path="/new/:mode/:categorySlug" element={<NewGamePage />} />
        <Route path="/play" element={<LocalGamePage />} />
        <Route path="/results" element={<LocalResultsPage />} />
        <Route path="/join" element={<JoinPage />} />
        <Route path="/join/:code" element={<JoinPage />} />
        <Route path="/room/:code" element={<RoomPage />} />
        <Route path="/daily" element={<DailyPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}

function NotFoundPage() {
  return (
    <PageShell title="Page not found">
      <p className="text-zinc-400">That page doesn't exist.</p>
      <Link to="/" className="mt-4 inline-block text-emerald-400 underline">
        Go home
      </Link>
    </PageShell>
  );
}

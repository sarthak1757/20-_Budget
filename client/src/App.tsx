import { Link, Route, Routes } from "react-router";
import { PageShell } from "./components/ui";
import { HomePage } from "./pages/HomePage";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
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

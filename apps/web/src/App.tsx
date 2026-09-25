import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes, useParams } from "react-router-dom";
import { Layout } from "./components/Layout";
import { DataProvider } from "./data/DataProvider";

// Every page is its own chunk: a visitor downloads only the page they open. Native scrolling, no
// animation library, no background effects — the app is quick on a mid-range phone.
const HomePage = lazy(() => import("./pages/HomePage").then((m) => ({ default: m.HomePage })));
const BrowsePage = lazy(() => import("./pages/BrowsePage").then((m) => ({ default: m.BrowsePage })));
const GameDetailPage = lazy(() => import("./pages/GameDetailPage").then((m) => ({ default: m.GameDetailPage })));
const PolicyPage = lazy(() => import("./pages/PolicyPage").then((m) => ({ default: m.PolicyPage })));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage").then((m) => ({ default: m.NotFoundPage })));

function PageFallback() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-label="Loading">
      <div className="h-8 w-2/3 animate-pulse rounded-lg bg-bg-surface" />
      <div className="h-64 animate-pulse rounded-2xl bg-bg-surface" />
      <div className="h-24 animate-pulse rounded-2xl bg-bg-surface" />
    </div>
  );
}

// Old links used /game/:id; keep them working.
function LegacyGameRedirect() {
  const { id } = useParams();
  return <Navigate to={`/games/${id}`} replace />;
}

export default function App() {
  return (
    <DataProvider>
      <BrowserRouter>
        <Layout>
          <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/browse" element={<BrowsePage />} />
              <Route path="/games/:id" element={<GameDetailPage />} />
              <Route path="/game/:id" element={<LegacyGameRedirect />} />
              <Route path="/policies/:slug" element={<PolicyPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </Layout>
      </BrowserRouter>
    </DataProvider>
  );
}

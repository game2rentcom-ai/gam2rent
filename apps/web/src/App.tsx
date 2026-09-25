import { LazyMotion, domAnimation, MotionConfig } from "motion/react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { MouseGlow } from "./components/MouseGlow";
import { ScrollProgress } from "./components/ScrollProgress";
import { SmoothScroll } from "./components/SmoothScroll";
import { SpaceBackground } from "./components/SpaceBackground";
import { DataProvider } from "./data/DataProvider";
import { BrowsePage } from "./pages/BrowsePage";
import { GameDetailPage } from "./pages/GameDetailPage";
import { HomePage } from "./pages/HomePage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { PolicyPage } from "./pages/PolicyPage";

export default function App() {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        <SmoothScroll>
          <DataProvider>
            <BrowserRouter>
              <ScrollProgress />
              <MouseGlow />
              <SpaceBackground />
              <Layout>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/browse" element={<BrowsePage />} />
                  <Route path="/games/:id" element={<GameDetailPage />} />
                  <Route path="/game/:id" element={<GameDetailPage />} />
                  <Route path="/policies/:slug" element={<PolicyPage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </Layout>
            </BrowserRouter>
          </DataProvider>
        </SmoothScroll>
      </MotionConfig>
    </LazyMotion>
  );
}

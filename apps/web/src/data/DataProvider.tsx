import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { Listing, ListedGame, Review } from "../types/listing";
import { catalog } from "./catalog";
import { demoListings, demoReviews } from "./demo";
import { fetchRemote, remoteConfigured } from "./remote";
import { StoreContext, type DataSource, type Store } from "./store";

// Decides where listings and reviews come from — and, just as important, where they DON'T:
//   1. Database configured  -> always use it (even in local dev, so the real thing can be tested).
//   2. Demo explicitly on   -> illustrative sample data (VITE_DEMO_DATA=true, or plain local dev).
//   3. Otherwise            -> nothing. Every game stays browsable, none shows a price, no reviews.
// A production build can therefore never show sample prices or reviews by accident.
function pickSource(): DataSource {
  if (remoteConfigured) return "remote";
  const flag = import.meta.env.VITE_DEMO_DATA;
  const demo = flag === "true" || (import.meta.env.DEV && flag !== "false");
  return demo ? "demo" : "none";
}

const SOURCE = pickSource();

interface Loaded {
  status: Store["status"];
  listings: Listing[];
  reviews: Review[];
}

function initialState(): Loaded {
  if (SOURCE === "remote") return { status: "loading", listings: [], reviews: [] };
  if (SOURCE === "demo") return { status: "ready", listings: demoListings, reviews: demoReviews };
  return { status: "ready", listings: [], reviews: [] };
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Loaded>(initialState);

  useEffect(() => {
    if (SOURCE !== "remote") return;
    let cancelled = false;
    fetchRemote()
      .then((data) => {
        if (!cancelled) setState({ status: "ready", ...data });
      })
      .catch((error: unknown) => {
        // Degrade to the honest empty state (browsable, no prices) rather than break the site.
        console.error("Could not load listings from the database", error);
        if (!cancelled) setState({ status: "error", listings: [], reviews: [] });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const store = useMemo<Store>(() => {
    const listedGames: ListedGame[] = [];
    for (const listing of state.listings) {
      const game = catalog.find((g) => g.id === listing.catalogId);
      if (!game) continue;
      listedGames.push({ ...game, listing, reviews: state.reviews.filter((r) => r.gameId === game.id) });
    }
    return {
      status: state.status,
      source: SOURCE,
      listedGames,
      reviews: state.reviews,
      findListedGame: (gameId) => listedGames.find((g) => g.id === gameId),
      reviewsFor: (gameId) => state.reviews.filter((r) => r.gameId === gameId),
    };
  }, [state]);

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { setContactNumber, whatsAppLink } from "../config";
import type { Listing, ListedGame, RentalOffer, Review } from "../types/listing";
import { catalog } from "./catalog";
import { isPlaceholder, type CatalogGame } from "./catalogTypes";
import { demoListings, demoRentalPlans, demoReviews } from "./demo";
import { fetchRemote, remoteConfigured } from "./remote";
import { StoreContext, type DataSource, type Store } from "./store";

// Decides where the store's data comes from — and, just as important, where it DOESN'T:
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

// Rentals are for PC online games the owner has marked rentable. PlayStation and cloud games are sold outright.
const rentable = (game: CatalogGame | undefined) => Boolean(game && game.isRentable !== false && game.platforms.includes("pc"));

interface Loaded {
  status: Store["status"];
  games: CatalogGame[];
  listings: Listing[];
  reviews: Review[];
  offers: Record<string, RentalOffer[]>;
  settings: Record<string, string>;
}

const EMPTY = { listings: [], reviews: [], offers: {}, settings: {} };

function initialState(): Loaded {
  if (SOURCE === "remote") return { status: "loading", games: catalog, ...EMPTY };
  if (SOURCE === "demo") {
    const offers = Object.fromEntries(catalog.map((g) => [g.id, demoRentalPlans]));
    return { status: "ready", games: catalog, listings: demoListings, reviews: demoReviews, offers, settings: {} };
  }
  return { status: "ready", games: catalog, ...EMPTY };
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Loaded>(initialState);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (SOURCE !== "remote") return;
    let cancelled = false;
    fetchRemote()
      .then((data) => {
        if (!cancelled) setState({ status: "ready", ...data });
      })
      .catch((error: unknown) => {
        // Degrade to the honest empty state (browsable, no prices) rather than break the site.
        console.error("Could not load the store's data", error);
        if (!cancelled) setState({ status: "error", games: catalog, ...EMPTY });
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const store = useMemo<Store>(() => {
    setContactNumber(state.settings.contact_whatsapp);
    const games = state.games.filter((g) => !isPlaceholder(g));
    const byId = new Map(games.map((g) => [g.id, g]));
    const listedGames: ListedGame[] = [];
    for (const listing of state.listings) {
      const game = byId.get(listing.catalogId);
      if (!game) continue;
      listedGames.push({ ...game, listing, reviews: state.reviews.filter((r) => r.gameId === game.id) });
    }
    return {
      status: state.status,
      reload: () => {
        setState((s) => ({ ...s, status: "loading" }));
        setAttempt((n) => n + 1);
      },
      source: SOURCE,
      games,
      findGame: (gameId) => byId.get(gameId),
      listedGames,
      findListedGame: (gameId) => listedGames.find((g) => g.id === gameId),
      reviews: state.reviews,
      reviewsFor: (gameId) => state.reviews.filter((r) => r.gameId === gameId),
      rentalOffersFor: (gameId) => (rentable(byId.get(gameId)) ? state.offers[gameId] ?? [] : []),
      setting: (key) => state.settings[key],
      contactLink: (message) => whatsAppLink(message),
    };
  }, [state]);

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

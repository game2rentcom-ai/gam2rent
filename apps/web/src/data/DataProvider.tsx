import { useEffect, useMemo, useState, type ReactNode } from "react";
import { setContactNumber, whatsAppLink } from "../config";
import type { Announcement } from "../types/announcement";
import type { Listing, ListedGame, RentalOffer, Review } from "../types/listing";
import { catalog } from "./catalog";
import { isPlaceholder, rentalPlatformsOf, type CatalogGame } from "./catalogTypes";
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

const rentable = (game: CatalogGame | undefined) => Boolean(game && rentalPlatformsOf(game).length > 0);

// The listing a card or price badge shows: the cheapest one on sale, else the cheapest at all.
const primaryListing = (listings: Listing[]) =>
  [...listings].sort((a, b) => Number(b.isAvailable) - Number(a.isAvailable) || a.price - b.price)[0]!;

interface Loaded {
  status: Store["status"];
  games: CatalogGame[];
  listings: Listing[];
  reviews: Review[];
  offers: Record<string, RentalOffer[]>;
  settings: Record<string, string>;
  announcements: Announcement[];
}

const EMPTY = { listings: [], reviews: [], offers: {}, settings: {}, announcements: [] };

function initialState(): Loaded {
  if (SOURCE === "remote") return { status: "loading", games: catalog, ...EMPTY };
  if (SOURCE === "demo") {
    const offers = Object.fromEntries(catalog.map((g) => [g.id, demoRentalPlans]));
    return { status: "ready", games: catalog, listings: demoListings, reviews: demoReviews, offers, settings: {}, announcements: [] };
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
    const listingsByGame = new Map<string, Listing[]>();
    for (const listing of state.listings) {
      if (!byId.has(listing.catalogId)) continue;
      listingsByGame.set(listing.catalogId, [...(listingsByGame.get(listing.catalogId) ?? []), listing]);
    }
    const listedGames: ListedGame[] = [...listingsByGame].map(([gameId, listings]) => ({
      ...byId.get(gameId)!,
      listing: primaryListing(listings),
      listings,
      reviews: state.reviews.filter((r) => r.gameId === gameId),
    }));
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
      announcements: state.announcements,
      setting: (key) => state.settings[key],
      contactLink: (message) => whatsAppLink(message),
    };
  }, [state]);

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

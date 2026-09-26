import { createContext, useContext } from "react";
import type { ListedGame, RentalOffer, Review } from "../types/listing";
import type { CatalogGame } from "./catalogTypes";

// Where the store's data came from — surfaced so the UI can be honest about it (a "demo data"
// banner) instead of silently showing illustrative numbers as if they were real.
//   remote — the configured Supabase database (production)
//   demo   — illustrative sample data, only when explicitly enabled (data/demo.ts)
//   none   — nothing configured: every game is browsable, none has a price
export type DataSource = "remote" | "demo" | "none";

export interface Store {
  /** "loading" only ever happens for the remote source; demo/none are ready immediately. */
  status: "loading" | "ready" | "error";
  /** Tries the database again after an "error" (games stay browsable meanwhile, just without prices). */
  reload: () => void;
  source: DataSource;
  /** Every published game: from the database, or the built-in starter list if that is unavailable. */
  games: CatalogGame[];
  findGame: (gameId: string) => CatalogGame | undefined;
  /** Games that currently have a listing (price, delivery time), joined with their reviews. */
  listedGames: ListedGame[];
  findListedGame: (gameId: string) => ListedGame | undefined;
  /** All verified reviews, newest first. */
  reviews: Review[];
  reviewsFor: (gameId: string) => Review[];
  /** Rental options the owner has priced for this game. An empty list means no rental price is set. */
  rentalOffersFor: (gameId: string) => RentalOffer[];
  /** A text setting the owner controls in the admin panel (announcement banner, support email...). */
  setting: (key: string) => string | undefined;
  /** A chat link to the business's number — the owner's Settings value when set, else the build's
   * default. Undefined when no number is available. Read it from the store (not config.ts directly)
   * so a component re-renders when the owner's number arrives. */
  contactLink: (message: string) => string | undefined;
}

export const StoreContext = createContext<Store | null>(null);

export function useStore(): Store {
  const store = useContext(StoreContext);
  if (!store) throw new Error("useStore must be used inside <DataProvider>");
  return store;
}

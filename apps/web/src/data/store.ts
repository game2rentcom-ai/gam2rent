import { createContext, useContext } from "react";
import type { ListedGame, Review } from "../types/listing";

// Where listings/reviews came from — surfaced so the UI can be honest about it (a "demo data"
// banner) instead of silently showing illustrative numbers as if they were real.
//   remote — the configured Supabase database (production)
//   demo   — illustrative sample data, only when explicitly enabled (data/demo.ts)
//   none   — nothing configured: every game is browsable, none has a price
export type DataSource = "remote" | "demo" | "none";

export interface Store {
  /** "loading" only ever happens for the remote source; demo/none are ready immediately. */
  status: "loading" | "ready" | "error";
  source: DataSource;
  /** Games that currently have a listing (price, delivery time), joined with their reviews. */
  listedGames: ListedGame[];
  /** All verified reviews, newest first. */
  reviews: Review[];
  findListedGame: (gameId: string) => ListedGame | undefined;
  reviewsFor: (gameId: string) => Review[];
}

export const StoreContext = createContext<Store | null>(null);

export function useStore(): Store {
  const store = useContext(StoreContext);
  if (!store) throw new Error("useStore must be used inside <DataProvider>");
  return store;
}

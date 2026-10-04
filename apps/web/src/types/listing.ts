import type { CatalogGame, Platform } from "../data/catalogTypes";

// A Listing is the buyable layer on top of the discovery catalog (data/catalog.ts). The 116-title
// catalog is real, but pricing/availability/delivery-time for all of them is not — inventing that
// would be the same kind of fabrication this project avoids everywhere else (no fake stats, no
// fake reviews). Only titles with a real, operator-configured Listing show a price/buy action;
// every other catalog title is still fully browsable with an honest "Check Availability" action
// instead of an invented price. See documentation/decision-log.md, 2026-09-21 CEO decisions.
//
// Listings and reviews come from the data store (data/DataProvider.tsx): Supabase in production,
// clearly-labelled demo data only when explicitly enabled. They are never hardcoded into pages.

export type CredentialType = "id_password" | "qr_code";

/** Reviews belong to a game, not to a listing — a title can have real past reviews while it is
 * temporarily not listed. Only verified-purchase reviews are ever read by the site (the database
 * policy enforces this too), so a `Review` in the UI is always a verified one. */
export interface Review {
  id: string;
  gameId: string; // references CatalogGame.id
  rating: number; // 1-5
  comment: string;
  reviewerName?: string; // first name, when the review came from a customer account
}

export interface Listing {
  catalogId: string; // references CatalogGame.id
  /** Which specific platform version this listing sells — a real SKU is platform-specific even
   * when the catalog game itself spans several (e.g. GTA V exists on PC/PS4/PS5/Xbox/Cloud, but
   * this particular listing might only be a PS4 version). Must be one of the catalog game's own
   * `platforms`. A game can have one listing per platform (e.g. PS4 and PS5 at different prices). */
  platform: Platform;
  price: number; // INR
  credentialType: CredentialType;
  isAvailable: boolean;
  isFeatured: boolean;
  deliveryEtaMinutes: number;
  /** Optional "was" price, so a real discount can be shown. */
  compareAtPrice?: number;
}

/** One rental option for a game, priced by the owner (a store-wide plan, or a per-game override). */
export interface RentalOffer {
  planId: string;
  label: string;
  hours: number;
  tag?: string;
  isPopular: boolean;
  price: number; // INR
}

// Merged view used throughout the UI — catalog facts (title, platforms, genre) + listing facts
// (price, ETA) + that game's verified reviews, without duplicating catalog data into the listing.
export interface ListedGame extends CatalogGame {
  /** The cheapest listing on sale — what cards and price badges show. */
  listing: Listing;
  /** Every platform this game is sold on (one listing per platform). */
  listings: Listing[];
  reviews: Review[];
}

export function averageRating(reviews: Review[]): number | null {
  if (reviews.length === 0) return null;
  return reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
}

export function deliveryEtaLabel(minutes: number): string {
  if (minutes < 60) return `~${minutes} min`;
  const hours = Math.round((minutes / 60) * 10) / 10;
  return `~${hours} hr`;
}

export function credentialDisclosure(type: CredentialType): string {
  return type === "id_password"
    ? "You'll get direct login access after purchase."
    : "You'll get a scan-to-play QR code after purchase — no password needed.";
}

import type { CredentialType, Listing, RentalOffer, Review } from "../types/listing";
import type { Announcement } from "../types/announcement";
import type { CatalogGame, Platform } from "./catalogTypes";
import { catalog } from "./catalog";

// Reads the store's data from Supabase's auto-generated REST API with plain fetch requests — no SDK,
// so the public bundle doesn't grow for what is a handful of GETs. This is safe from the browser ONLY
// because every table has row-level security and the anon role can read but never write
// (supabase/sql, proven by supabase/tests). The owner edits this data in the admin panel.

const url = import.meta.env.VITE_SUPABASE_URL?.replace(/\/+$/, "");
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const remoteConfigured = Boolean(url && key);

const PLATFORMS: Platform[] = ["pc", "ps4", "ps5", "cloud"];
const CREDENTIALS: CredentialType[] = ["id_password", "qr_code"];

export interface RemoteData {
  games: CatalogGame[];
  listings: Listing[];
  reviews: Review[];
  offers: Record<string, RentalOffer[]>;
  settings: Record<string, string>;
  announcements: Announcement[];
}

const isHttps = (v: unknown): v is string => typeof v === "string" && v.startsWith("https://");
const text = (v: unknown) => (typeof v === "string" ? v : "");

// Every row is validated: a typo made in the admin panel or Table Editor (an unknown game id, a
// negative price) drops that one row with a console warning, never breaks the storefront or shows a
// wrong price. Pure and exported so it can be exercised without a network.
export function mapGames(rows: Record<string, unknown>[]): CatalogGame[] {
  const games: CatalogGame[] = [];
  for (const row of rows) {
    const platforms = Array.isArray(row.platforms) ? row.platforms.filter((p): p is Platform => PLATFORMS.includes(p as Platform)) : [];
    if (typeof row.id !== "string" || typeof row.title !== "string" || platforms.length === 0) {
      console.warn("Ignoring invalid game row", row);
      continue;
    }
    games.push({
      id: row.id,
      title: row.title,
      franchise: text(row.franchise) || row.title,
      category: row.category === "app" ? "app" : "game",
      genre: text(row.genre),
      platforms,
      developer: text(row.developer),
      publisher: text(row.publisher),
      releaseInfo: text(row.release_info),
      description: text(row.description),
      coverUrl: isHttps(row.cover_url) ? row.cover_url : undefined,
      heroUrl: isHttps(row.hero_url) ? row.hero_url : undefined,
      isRentable: row.is_rentable !== false,
      rentalPlatforms: Array.isArray(row.rental_platforms)
        ? row.rental_platforms.filter((p): p is Platform => PLATFORMS.includes(p as Platform))
        : undefined,
    });
  }
  return games;
}

export function mapRows(
  listingRows: Record<string, unknown>[],
  reviewRows: Record<string, unknown>[],
  knownGameIds: Set<string>,
): { listings: Listing[]; reviews: Review[] } {
  const listings: Listing[] = [];
  for (const row of listingRows) {
    const { game_id, platform, price, credential_type, delivery_eta_minutes } = row;
    const valid =
      typeof game_id === "string" &&
      knownGameIds.has(game_id) &&
      PLATFORMS.includes(platform as Platform) &&
      typeof price === "number" &&
      Number.isFinite(price) &&
      price >= 0 &&
      CREDENTIALS.includes(credential_type as CredentialType) &&
      typeof delivery_eta_minutes === "number" &&
      delivery_eta_minutes > 0;
    if (!valid) {
      console.warn("Ignoring invalid listing row", row);
      continue;
    }
    listings.push({
      catalogId: game_id,
      platform: platform as Platform,
      price,
      credentialType: credential_type as CredentialType,
      deliveryEtaMinutes: delivery_eta_minutes,
      isAvailable: row.is_available !== false,
      isFeatured: row.is_featured === true,
      compareAtPrice: typeof row.compare_at_price === "number" ? row.compare_at_price : undefined,
    });
  }

  const reviews: Review[] = [];
  for (const row of reviewRows) {
    const { id, game_id, rating, comment } = row;
    const valid =
      typeof id === "string" &&
      typeof game_id === "string" &&
      knownGameIds.has(game_id) &&
      typeof rating === "number" &&
      rating >= 1 &&
      rating <= 5 &&
      typeof comment === "string" &&
      comment.trim().length > 0;
    if (!valid) {
      console.warn("Ignoring invalid review row", row);
      continue;
    }
    reviews.push({ id, gameId: game_id, rating, comment, reviewerName: typeof row.reviewer_name === "string" ? row.reviewer_name : undefined });
  }
  return { listings, reviews };
}

export function mapOffers(rows: Record<string, unknown>[]): Record<string, RentalOffer[]> {
  const offers: Record<string, RentalOffer[]> = {};
  for (const row of rows) {
    if (typeof row.game_id !== "string" || typeof row.plan_id !== "string" || typeof row.price !== "number" || typeof row.hours !== "number") continue;
    (offers[row.game_id] ??= []).push({
      planId: row.plan_id,
      label: text(row.label),
      hours: row.hours,
      tag: typeof row.tag === "string" && row.tag ? row.tag : undefined,
      isPopular: row.is_popular === true,
      price: row.price,
    });
  }
  for (const list of Object.values(offers)) list.sort((a, b) => a.hours - b.hours);
  return offers;
}

const time = (v: unknown) => {
  const ms = typeof v === "string" ? Date.parse(v) : NaN;
  return Number.isNaN(ms) ? undefined : ms;
};

// Only https pictures, and links that stay on the store or go to an https page (the database checks this too).
export function mapAnnouncements(rows: Record<string, unknown>[]): Announcement[] {
  const slides: Announcement[] = [];
  for (const row of rows) {
    if (typeof row.id !== "string" || typeof row.title !== "string" || !row.title.trim()) continue;
    const href = typeof row.button_href === "string" && /^(\/[^/]|https:\/\/)/.test(row.button_href) ? row.button_href : undefined;
    const label = typeof row.button_label === "string" && row.button_label.trim() ? row.button_label.trim() : undefined;
    slides.push({
      id: row.id,
      title: row.title,
      subtitle: text(row.subtitle) || undefined,
      imageUrl: isHttps(row.image_url) ? row.image_url : undefined,
      button: href && label ? { label, href } : undefined,
      startsAt: time(row.starts_at),
      endsAt: time(row.ends_at),
      countdownTo: time(row.countdown_to),
    });
  }
  return slides;
}

export function mapSettings(rows: Record<string, unknown>[]): Record<string, string> {
  const settings: Record<string, string> = {};
  for (const row of rows) {
    if (typeof row.key === "string" && typeof row.value === "string") settings[row.key] = row.value;
  }
  return settings;
}

async function getJson<T>(path: string, signal: AbortSignal): Promise<T> {
  const response = await fetch(`${url}/rest/v1/${path}`, {
    headers: { apikey: key!, Authorization: `Bearer ${key}` },
    signal,
  });
  if (!response.ok) throw new Error(`Supabase request failed (${response.status}) for ${path}`);
  return (await response.json()) as T;
}

/**
 * A plain read for the optional extras (comments, the request board, suggestions) — public data only,
 * with the same no-SDK approach. `body` turns it into a call to a database function. Anything that goes
 * wrong (not configured, an older database, offline) is just `null`: the extra isn't shown.
 */
export async function readRemote<T>(path: string, body?: unknown): Promise<T | null> {
  if (!remoteConfigured) return null;
  try {
    const response = await fetch(`${url}/rest/v1/${path}`, {
      method: body === undefined ? "GET" : "POST",
      headers: { apikey: key!, Authorization: `Bearer ${key}`, ...(body === undefined ? {} : { "Content-Type": "application/json" }) },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(8000),
    });
    return response.ok ? ((await response.json()) as T) : null;
  } catch {
    return null;
  }
}

// Games, rental prices and settings degrade to "not there" if their request fails (the store stays
// browsable from the built-in list). Listings and reviews are the core: if they fail, the caller
// shows the error state.
const soft = <T,>(promise: Promise<T>, fallback: T) => promise.catch((error: unknown) => {
  console.warn("Optional data unavailable", error);
  return fallback;
});

export async function fetchRemote(): Promise<RemoteData> {
  // A slow or unreachable database must not leave the page loading forever.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  const { signal } = controller;
  try {
    const [listingRows, reviewRows, gameRows, offerRows, settingRows, slideRows] = await Promise.all([
      getJson<Record<string, unknown>[]>("listings?select=*", signal),
      // Newer databases have reviewer_name / is_hidden; an older schema doesn't — fall back rather than fail.
      getJson<Record<string, unknown>[]>("reviews?select=id,game_id,rating,comment,reviewer_name&verified=eq.true&is_hidden=eq.false&order=created_at.desc", signal)
        .catch(() => getJson<Record<string, unknown>[]>("reviews?select=id,game_id,rating,comment&verified=eq.true&order=created_at.desc", signal)),
      soft(getJson<Record<string, unknown>[]>("games?select=*&order=title.asc", signal), []),
      soft(getJson<Record<string, unknown>[]>("rental_offers?select=*", signal), []),
      soft(getJson<Record<string, unknown>[]>("site_settings?select=key,value", signal), []),
      soft(getJson<Record<string, unknown>[]>("announcements?select=*&order=sort_order.asc,created_at.asc", signal), []),
    ]);
    const dbGames = mapGames(gameRows);
    const games = dbGames.length > 0 ? dbGames : catalog;
    const { listings, reviews } = mapRows(listingRows, reviewRows, new Set(games.map((g) => g.id)));
    return { games, listings, reviews, offers: mapOffers(offerRows), settings: mapSettings(settingRows), announcements: mapAnnouncements(slideRows) };
  } finally {
    clearTimeout(timeout);
  }
}

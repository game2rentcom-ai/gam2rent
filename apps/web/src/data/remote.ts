import type { CredentialType, Listing, Review } from "../types/listing";
import type { Platform } from "./catalogTypes";
import { catalog } from "./catalog";

// Reads listings + verified reviews from Supabase's auto-generated REST API with a plain fetch —
// no supabase-js SDK, so the public bundle doesn't grow by tens of KB for what is two GET requests.
// This is safe to do from the browser ONLY because the database has row-level security on and the
// anon role can read but never write (supabase/schema.sql, verified by supabase/tests). Editing
// happens in Supabase's Table Editor, not in this app — see documentation/decision-log.md,
// 2026-09-25 entry on why there is no custom admin panel yet.

const url = import.meta.env.VITE_SUPABASE_URL?.replace(/\/+$/, "");
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const remoteConfigured = Boolean(url && key);

const PLATFORMS: Platform[] = ["pc", "ps4", "ps5", "xbox", "cloud"];
const CREDENTIALS: CredentialType[] = ["id_password", "qr_code"];
const KNOWN_GAME_IDS = new Set(catalog.map((g) => g.id));

interface ListingRow {
  game_id: unknown;
  platform: unknown;
  price: unknown;
  credential_type: unknown;
  delivery_eta_minutes: unknown;
  is_available: unknown;
  is_featured: unknown;
}

interface ReviewRow {
  id: unknown;
  game_id: unknown;
  rating: unknown;
  comment: unknown;
}

// Pure and exported so it can be exercised without a network. Every row is validated: a typo made
// in the Table Editor (an unknown game id, a negative price) must drop that one row with a console
// warning, never break the storefront or show a wrong price.
export function mapRows(listingRows: ListingRow[], reviewRows: ReviewRow[]): { listings: Listing[]; reviews: Review[] } {
  const listings: Listing[] = [];
  for (const row of listingRows) {
    const { game_id, platform, price, credential_type, delivery_eta_minutes } = row;
    const valid =
      typeof game_id === "string" &&
      KNOWN_GAME_IDS.has(game_id) &&
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
    });
  }

  const reviews: Review[] = [];
  for (const row of reviewRows) {
    const { id, game_id, rating, comment } = row;
    const valid =
      typeof id === "string" &&
      typeof game_id === "string" &&
      KNOWN_GAME_IDS.has(game_id) &&
      typeof rating === "number" &&
      rating >= 1 &&
      rating <= 5 &&
      typeof comment === "string" &&
      comment.trim().length > 0;
    if (!valid) {
      console.warn("Ignoring invalid review row", row);
      continue;
    }
    reviews.push({ id, gameId: game_id, rating, comment });
  }

  return { listings, reviews };
}

async function getJson<T>(path: string, signal: AbortSignal): Promise<T> {
  const response = await fetch(`${url}/rest/v1/${path}`, {
    headers: { apikey: key!, Authorization: `Bearer ${key}` },
    signal,
  });
  if (!response.ok) throw new Error(`Supabase request failed (${response.status}) for ${path}`);
  return (await response.json()) as T;
}

export async function fetchRemote(): Promise<{ listings: Listing[]; reviews: Review[] }> {
  // A slow or unreachable database must not leave the page loading forever.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const [listingRows, reviewRows] = await Promise.all([
      getJson<ListingRow[]>("listings?select=*", controller.signal),
      getJson<ReviewRow[]>("reviews?select=id,game_id,rating,comment&verified=eq.true&order=created_at.desc", controller.signal),
    ]);
    return mapRows(listingRows, reviewRows);
  } finally {
    clearTimeout(timeout);
  }
}

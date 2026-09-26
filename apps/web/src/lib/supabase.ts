import type { SupabaseClient } from "@supabase/supabase-js";

// The Supabase client, loaded on demand. A visitor who just browses never downloads it: it is fetched
// only when someone signs in, already has a saved login, or arrives from an email link (confirm /
// reset password). Browsing itself reads public data with plain fetch (data/remote.ts).
const url = import.meta.env.VITE_SUPABASE_URL?.replace(/\/+$/, "");
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** False when the site has no back end configured (accounts and the admin panel are then hidden). */
export const backendConfigured = Boolean(url && key);

let pending: Promise<SupabaseClient> | undefined;

export function getClient(): Promise<SupabaseClient> {
  if (!backendConfigured) return Promise.reject(new Error("The store's back end isn't configured."));
  pending ??= import("@supabase/supabase-js").then(({ createClient }) =>
    createClient(url!, key!, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }),
  );
  return pending;
}

/** True when an earlier visit left a saved login in this browser. */
export function hasStoredSession(): boolean {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      if (/^sb-.+-auth-token$/.test(localStorage.key(i) ?? "")) return true;
    }
  } catch {
    /* storage blocked (private mode): treat as signed out */
  }
  return false;
}

/** True when the page was opened from an email link that carries a token in the URL. */
export function arrivedFromEmailLink(): boolean {
  return /access_token=|refresh_token=|type=(recovery|signup|magiclink|invite)|[?&]code=/.test(window.location.hash + window.location.search);
}

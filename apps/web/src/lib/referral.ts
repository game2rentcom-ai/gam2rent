import type { SupabaseClient } from "@supabase/supabase-js";

// A friend's referral code, kept from the link they came in by until the new account is signed in, then
// given to the server once. Kept in this browser only; the server decides whether it counts.
const KEY = "referral-code";

export function rememberReferral(code: string | null): void {
  try {
    if (code?.trim()) localStorage.setItem(KEY, code.trim().toUpperCase().slice(0, 32));
  } catch { /* private browsing: the link simply doesn't count */ }
}

export async function claimRememberedReferral(client: SupabaseClient): Promise<void> {
  let code: string | null = null;
  try { code = localStorage.getItem(KEY); } catch { return; }
  if (!code) return;
  const { error } = await client.rpc("claim_referral", { p_code: code });
  if (!error) {
    try { localStorage.removeItem(KEY); } catch { /* nothing to clean up */ }
  }
}
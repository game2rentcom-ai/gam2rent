import type { SupabaseClient } from "@supabase/supabase-js";
import { useState } from "react";
import { ok, useLoad } from "../lib/api";
import { Button } from "../ui/Button";
import { Notice } from "../ui/Form";
import { formatPrice } from "../ui/format";

// Refer a friend: their code and link, how far they are to the reward, their coins, and the reward codes once
// unlocked. Friends' names are never shown, only the counts.
interface Summary {
  code: string | null;
  referrals: number; referrals_needed: number;
  games_bought: number; games_needed: number;
  coins: number; coins_per_referral: number; max_coins_per_order: number;
  rewards: { free_game_title: string | null; free_game_code: string; discount_code: string } | null;
}

async function loadSummary(client: SupabaseClient) {
  return (await ok(client.rpc("referral_summary"))) as Summary;
}

export function ReferralCard() {
  const { data, error, loading, reload } = useLoad(loadSummary, undefined);
  const [copied, setCopied] = useState(false);
  if (loading) return <div className="h-40 animate-pulse rounded-2xl bg-bg-surface" aria-busy="true" aria-label="Loading your referrals" />;
  if (error || !data) return <Notice tone="error" onRetry={reload}>{error ?? "We couldn’t load your referrals just now."}</Notice>;

  const link = data.code ? `${window.location.origin}/signup?ref=${data.code}` : "";
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* clipboard blocked: the link is on screen to copy by hand */ }
  };

  return (
    <section aria-label="Refer a friend" className="panel flex flex-col gap-4 p-5">
      <div>
        <h2 className="font-display text-lg font-bold text-text-primary">Refer a friend</h2>
        <p className="mt-1 text-sm text-text-muted">
          When a friend signs up with your link and buys a game, you get {data.coins_per_referral} coins. Use up to {data.max_coins_per_order} coins on each order.
        </p>
      </div>

      {data.code && (
        <div className="flex flex-col gap-2">
          <p className="break-all rounded-xl border border-border-strong bg-bg-base px-3 py-2 font-mono text-sm text-text-primary">{link}</p>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" onClick={() => void copy()}>{copied ? "Copied" : "Copy link"}</Button>
            <span className="text-sm text-text-muted">Your code: <span className="font-mono font-semibold text-text-primary">{data.code}</span></span>
          </div>
        </div>
      )}

      <dl className="grid grid-cols-3 gap-3 text-center">
        <div className="panel p-3"><dt className="text-xs text-text-muted">Friends who bought</dt><dd className="font-display text-xl font-bold text-text-primary">{data.referrals} / {data.referrals_needed}</dd></div>
        <div className="panel p-3"><dt className="text-xs text-text-muted">Games you bought</dt><dd className="font-display text-xl font-bold text-text-primary">{data.games_bought} / {data.games_needed}</dd></div>
        <div className="panel p-3"><dt className="text-xs text-text-muted">Your coins</dt><dd className="font-display text-xl font-bold text-text-primary">{data.coins}</dd></div>
      </dl>

      {data.rewards ? (
        <div className="flex flex-col gap-2 rounded-xl border border-trust-300 bg-trust-100 p-4 text-sm">
          <p className="font-semibold text-text-primary">Your reward is unlocked.</p>
          <p className="text-text-muted">
            A free game{data.rewards.free_game_title ? `: ${data.rewards.free_game_title}` : ""}. Code <span className="font-mono font-semibold text-text-primary">{data.rewards.free_game_code}</span>
          </p>
          <p className="text-text-muted">
            95% off any game. Code <span className="font-mono font-semibold text-text-primary">{data.rewards.discount_code}</span>
          </p>
          <p className="text-xs text-text-muted">Each code works once, for 90 days from when it was unlocked.</p>
        </div>
      ) : (
        <p className="text-sm text-text-muted">
          Refer 5 friends who buy, and buy 5 games yourself, and you unlock a free game and a 95%-off code.
          {data.referrals >= data.referrals_needed && data.games_bought >= data.games_needed ? " You’ve reached both targets — the reward is on its way." : ""}
        </p>
      )}
      {data.coins > 0 && <p className="text-xs text-text-muted">Your coins are used automatically at checkout, up to {formatPrice(data.max_coins_per_order)} per order.</p>}
    </section>
  );
}
import type { SupabaseClient } from "@supabase/supabase-js";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "../auth/context";
import { useStore } from "../data/store";
import { backendConfigured } from "../lib/supabase";
import { ShopContext, type CartLine, type Shop } from "./context";

// The signed-in customer's wishlist and cart. Both live in the database (row-level security keeps each
// customer to their own rows). If those tables aren't reachable — the database predates them — `ready`
// turns false and the store quietly falls back to "Buy opens a chat", so nothing breaks.

interface Loaded { userId: string; ready: boolean; wishlist: string[]; cart: CartLine[] }

async function load(client: SupabaseClient, userId: string): Promise<Loaded> {
  const [wishlist, cart] = await Promise.all([
    client.from("wishlist_items").select("game_id"),
    client.from("cart_items").select("game_id,kind,plan_id,platform"),
  ]);
  if (wishlist.error || cart.error) return { userId, ready: false, wishlist: [], cart: [] };
  return {
    userId,
    ready: true,
    wishlist: (wishlist.data as { game_id: string }[]).map((r) => r.game_id),
    cart: (cart.data as { game_id: string; kind: "buy" | "rent"; plan_id: string | null; platform: string | null }[]).map((r) => ({ gameId: r.game_id, kind: r.kind, planId: r.plan_id, platform: r.platform })),
  };
}

const limitMessage = (what: string, max: number) => `Your ${what} is full (${max} games). Remove one first.`;

export function ShopProvider({ children }: { children: ReactNode }) {
  const { user, client } = useAuth();
  const { setting } = useStore();
  const userId = user?.id;
  const [version, setVersion] = useState(0);
  const [loaded, setLoaded] = useState<Loaded | null>(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    client()
      .then((c) => load(c, userId))
      .then(
        (result) => !cancelled && setLoaded(result),
        () => !cancelled && setLoaded({ userId, ready: false, wishlist: [], cart: [] }),
      );
    return () => {
      cancelled = true;
    };
  }, [userId, client, version]);

  const mine = loaded && loaded.userId === userId ? loaded : null;
  const ready = userId ? (mine?.ready ?? null) : null;
  const paymentsOn = backendConfigured && setting("payments_enabled") === "true";

  const value = useMemo<Shop>(() => {
    // Update what's on screen at once, then re-read: if the first load was still in flight (a quick tap right
    // after the page opened) the re-read is what puts the change on screen, and it supersedes the older read.
    const change = (apply: (l: Loaded) => Loaded) => {
      setLoaded((prev) => (prev && prev.userId === userId ? apply(prev) : prev));
      setVersion((v) => v + 1);
    };
    return {
      ready,
      ordering: paymentsOn && ready !== false,
      wishlist: mine?.wishlist ?? [],
      cart: mine?.cart ?? [],

      async toggleWishlist(gameId) {
        if (!userId) return { error: "Please log in first." };
        const has = mine?.wishlist.includes(gameId) ?? false;
        const supabase = await client();
        const { error } = has
          ? await supabase.from("wishlist_items").delete().eq("game_id", gameId)
          : await supabase.from("wishlist_items").insert({ user_id: userId, game_id: gameId });
        if (error) return { error: error.message.includes("limit_reached") ? limitMessage("wishlist", 200) : "We couldn’t update your wishlist. Please try again." };
        change((l) => ({ ...l, wishlist: has ? l.wishlist.filter((id) => id !== gameId) : [...l.wishlist, gameId] }));
        return {};
      },

      async addToCart(line) {
        if (!userId) return { error: "Please log in first." };
        const supabase = await client();
        const { error } = await supabase.from("cart_items").upsert({ user_id: userId, game_id: line.gameId, kind: line.kind, plan_id: line.planId, platform: line.platform }, { onConflict: "user_id,game_id" });
        if (error) return { error: error.message.includes("limit_reached") ? limitMessage("cart", 20) : "We couldn’t add that to your cart. Please try again." };
        change((l) => ({ ...l, cart: [...l.cart.filter((c) => c.gameId !== line.gameId), line] }));
        return {};
      },

      async removeFromCart(gameId) {
        if (!userId) return { error: "Please log in first." };
        const { error } = await (await client()).from("cart_items").delete().eq("game_id", gameId);
        if (error) return { error: "We couldn’t remove that. Please try again." };
        change((l) => ({ ...l, cart: l.cart.filter((c) => c.gameId !== gameId) }));
        return {};
      },

      refresh: () => setVersion((v) => v + 1),
    };
  }, [ready, paymentsOn, mine, userId, client]);

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

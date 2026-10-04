import type { SupabaseClient } from "@supabase/supabase-js";
import { ok } from "../lib/api";

// Store-wide rental plans (1 day, 3 days, …). A plan's price applies to every rentable game unless a
// game has its own price for it.
export interface Plan { id: string; label: string; hours: number; price: number; tag: string | null; is_popular: boolean; is_active: boolean; sort_order: number }

export async function loadPlans(client: SupabaseClient) {
  return (await ok(client.from("rental_plans").select("*").order("sort_order").order("hours"))) as Plan[];
}

import type { SupabaseClient } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { useAuth } from "../auth/context";

// Data helpers for every screen that talks to the signed-in API (admin, cart, orders).

export const errorMessage = (e: unknown): string => {
  const text = e instanceof Error ? e.message : typeof e === "object" && e && "message" in e ? String((e as { message: unknown }).message) : "";
  if (/row-level security|permission denied|Forbidden/i.test(text)) return "You don’t have permission to do that.";
  if (/invalid_transition/.test(text)) return "That change isn’t allowed for this order’s current status.";
  if (/use_refund_function/.test(text)) return "This order was paid through Razorpay — use “Refund via Razorpay” so the money goes back.";
  if (/unknown_customer/.test(text)) return "Choose a customer who has an account.";
  if (/duplicate key|already exists/i.test(text)) return "That already exists.";
  if (/violates foreign key/i.test(text)) return "That is still in use, so it can’t be removed. Hide it instead.";
  if (/violates check/i.test(text)) return "One of the values isn’t allowed. Check the numbers and try again.";
  return text || "Something went wrong. Please try again.";
};

/**
 * Loads data with the signed-in client and re-loads on demand. `loader` must be a stable function
 * (declared outside the component); `arg` is what varies. Nothing is set synchronously in the effect.
 * A reload keeps showing the old data until the new arrives, so a screen never flashes empty (and loses
 * its "Saved." message) right after a save; `loading` is only true while there is nothing to show.
 */
export function useLoad<T, A = void>(loader: (client: SupabaseClient, arg: A) => Promise<T>, arg: A) {
  const { client } = useAuth();
  const [version, setVersion] = useState(0);
  const [result, setResult] = useState<{ arg: A; data?: T; error?: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    client()
      .then((c) => loader(c, arg))
      .then(
        (data) => !cancelled && setResult({ arg, data }),
        (e: unknown) => !cancelled && setResult({ arg, error: errorMessage(e) }),
      );
    return () => {
      cancelled = true;
    };
  }, [client, loader, arg, version]);

  const current = result && Object.is(result.arg, arg) ? result : null;
  return { data: current?.data, error: current?.error, loading: current === null, reload: () => setVersion((v) => v + 1) };
}

/** Runs a save action with a busy flag and a success/error message. */
export function useAction() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const run = async (action: () => Promise<unknown>, success = "Saved.") => {
    setBusy(true);
    setMessage(null);
    try {
      await action();
      setMessage({ tone: "success", text: success });
      return true;
    } catch (e) {
      setMessage({ tone: "error", text: errorMessage(e) });
      return false;
    } finally {
      setBusy(false);
    }
  };
  return { busy, message, run, clear: () => setMessage(null) };
}

/** Supabase returns { data, error } instead of throwing; this makes a failed call throw. */
export async function ok<T>(request: PromiseLike<{ data: T; error: { message: string } | null }>): Promise<T> {
  const { data, error } = await request;
  if (error) throw new Error(error.message);
  return data;
}

/** "1499" -> 1499; anything that is not whole digits -> null. Prices are whole rupees. */
export const toInt = (value: string): number | null => (/^\d+$/.test(value.trim()) ? Number(value.trim()) : null);

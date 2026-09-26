import type { SupabaseClient } from "@supabase/supabase-js";

// Paying for the cart. The browser never sends a price: it asks the server function to start a payment
// (the database prices the cart and creates the order), opens Razorpay's payment window for exactly
// that amount, and afterwards asks the server to confirm the payment with Razorpay before showing "Paid".

/** An error from one of our server functions, with a code the screens can react to. */
export class ApiError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

export async function callFunction<T>(client: SupabaseClient, name: string, body: unknown): Promise<T> {
  const { data, error } = await client.functions.invoke(name, { body: body as Record<string, unknown> });
  if (!error) return data as T;
  const context = (error as { context?: unknown }).context;
  if (context instanceof Response) {
    const detail = (await context.json().catch(() => null)) as { error?: string; message?: string } | null;
    // Supabase's own "no such function" answer (ours always carry an `error` code): payments aren't set up yet.
    if (context.status === 404 && !detail?.error) throw new ApiError("payments_not_configured", "Online payment isn’t set up yet.");
    throw new ApiError(detail?.error ?? "server_error", detail?.message ?? "Something went wrong. Please try again.");
  }
  throw new ApiError("network", "We couldn’t reach the server. Check your connection and try again.");
}

/** What to tell a customer when starting or confirming a payment fails. */
export function paymentProblem(e: unknown): { code: string; text: string } {
  const code = e instanceof ApiError ? e.code : "network";
  const text =
    code === "phone_required" ? "Add your WhatsApp number to your account first — that’s where we send your game."
    : code === "payments_not_configured" ? "Online payment isn’t available right now. You can order on WhatsApp instead."
    : code === "too_many_pending" ? "You have several unpaid orders. Please wait a little while, or message us."
    : e instanceof Error && e.message ? e.message
    : "Something went wrong. Please try again.";
  return { code, text };
}

interface RazorpayResponse { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }
interface RazorpayOptions {
  key: string; order_id: string; amount: number; currency: string; name: string; description: string;
  prefill: { name?: string; contact?: string }; theme: { color: string };
  handler: (response: RazorpayResponse) => void; modal: { ondismiss: () => void };
}
declare global {
  interface Window { Razorpay?: new (options: RazorpayOptions) => { open(): void } }
}

let scriptLoading: Promise<void> | null = null;
function loadRazorpay(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  scriptLoading ??= new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve();
    script.onerror = () => {
      scriptLoading = null;
      reject(new ApiError("network", "We couldn’t open the payment window. Check your connection and try again."));
    };
    document.head.appendChild(script);
  });
  return scriptLoading;
}

interface Created { order_id: string; status: "paid" | "pending_payment"; razorpay_order_id?: string; amount?: number; currency?: string; key_id?: string }

// "confirming": the customer paid in Razorpay's window but our confirmation call didn't come back (a dropped
// connection, a slow bank). The money has moved, so this is never an error: Razorpay also tells our server
// directly, and the order page shows the order the moment that lands.
export type PayResult = { status: "paid" | "confirming" | "cancelled"; orderId: string };

export async function payForCart(client: SupabaseClient, options: { coupon: string; name: string; phone: string; business: string }): Promise<PayResult> {
  const created = await callFunction<Created>(client, "create-payment", { coupon: options.coupon });
  if (created.status === "paid") return { status: "paid", orderId: created.order_id };

  await loadRazorpay();
  return new Promise((resolve) => {
    let settled = false;
    const settle = (finish: () => void) => {
      if (!settled) {
        settled = true;
        finish();
      }
    };
    new window.Razorpay!({
      key: created.key_id!,
      order_id: created.razorpay_order_id!,
      amount: created.amount!,
      currency: created.currency!,
      name: options.business,
      description: "Game order",
      prefill: { name: options.name, contact: options.phone },
      theme: { color: "#8b2fff" },
      handler: (response) =>
        void callFunction(client, "verify-payment", response).then(
          () => settle(() => resolve({ status: "paid", orderId: created.order_id })),
          () => settle(() => resolve({ status: "confirming", orderId: created.order_id })),
        ),
      modal: { ondismiss: () => settle(() => resolve({ status: "cancelled", orderId: created.order_id })) },
    }).open();
  });
}

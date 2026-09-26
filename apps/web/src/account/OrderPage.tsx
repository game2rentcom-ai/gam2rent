import type { SupabaseClient } from "@supabase/supabase-js";
import { Link, useParams } from "react-router-dom";
import { PLATFORM_LABEL, type Platform } from "../data/catalogTypes";
import { useStore } from "../data/store";
import { ok, useLoad } from "../lib/api";
import { Delivery } from "../shop/Delivery";
import { OrderProgress } from "./OrderProgress";
import { ReviewForm, YourReview, type MyReview } from "./ReviewForm";
import { STATUS_LABEL, formatDate, formatDateTime, orderName, type Order, type OrderItem } from "../shop/orders";
import { Badge } from "../ui/Chip";
import { Button } from "../ui/Button";
import { Notice } from "../ui/Form";
import { etaLabel, formatPrice } from "../ui/format";

// One order: where it is, what was bought, the delivered login details (fetched only when the customer
// asks — the server decrypts them for the order's owner alone), and a printable receipt.
async function loadOrder(client: SupabaseClient, id: string) {
  const order = (await ok(client.from("orders").select("*").eq("id", id).maybeSingle())) as Order | null;
  if (!order) return null;
  const items = (await ok(client.from("order_items").select("*").eq("order_id", id).order("title"))) as OrderItem[];
  // Reviews are an extra: if the database predates them, the page simply doesn't offer one.
  const reviews = await client.from("reviews").select("order_item_id,rating,comment").in("order_item_id", items.map((i) => i.id));
  return { order, items, reviews: reviews.error ? null : new Map((reviews.data as MyReview[]).map((r) => [r.order_item_id, r])) };
}

const NEXT_STEP: Record<Order["status"], string> = {
  pending_payment: "We’re waiting for your payment. Unpaid orders are cancelled automatically after an hour — you can start again from your cart.",
  paid: "Payment received. We’re getting your game ready — its details will appear on this page once it’s delivered.",
  in_progress: "We’re preparing your game. Some items may already be ready below.",
  delivered: "Everything has been delivered. Enjoy!",
  cancelled: "This order was cancelled.",
  refunded: "This order was refunded.",
};

export function OrderPage() {
  const { id = "" } = useParams();
  const { data, error, loading, reload } = useLoad(loadOrder, id);
  const { setting } = useStore();

  if (loading) return <div className="h-64 animate-pulse rounded-2xl bg-bg-surface" aria-busy="true" aria-label="Loading your order" />;
  if (error) return <Notice tone="error">{error}</Notice>;
  if (!data) return <Notice tone="error">We couldn’t find that order.</Notice>;
  const { order, items, reviews } = data;
  const status = STATUS_LABEL[order.status];
  const live = order.status === "paid" || order.status === "in_progress" || order.status === "delivered";
  const business = [setting("business_name"), setting("business_address"), setting("gstin") && `GSTIN ${setting("gstin")}`].filter(Boolean);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 py-2 sm:py-6">
      <div className="print:hidden">
        <Link to="/account/orders" className="-ml-2 inline-flex min-h-11 items-center rounded-lg px-2 text-sm font-semibold text-text-muted hover:text-text-primary">← My orders</Link>
      </div>
      <header className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-2xl font-bold text-text-primary sm:text-3xl">Order {orderName(order)}</h1>
        <Badge tone={status.tone}>{status.label}</Badge>
      </header>
      <p className="-mt-3 text-sm text-text-muted">Placed {formatDateTime(order.created_at)}</p>
      <OrderProgress status={order.status} />
      <Notice tone={order.status === "cancelled" || order.status === "refunded" ? "info" : "success"}>{NEXT_STEP[order.status]}</Notice>
      {order.status === "pending_payment" && <div className="print:hidden"><Button variant="secondary" onClick={reload}>Check again</Button></div>}

      <ul className="flex flex-col gap-3">
        {items.map((item) => (
          <li key={item.id} className="panel p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-display text-sm font-bold text-text-primary">{item.title}</p>
                <p className="text-xs text-text-muted">
                  {item.kind === "rent" ? `Rent · ${item.plan_label}` : "Buy"} · {PLATFORM_LABEL[item.platform as Platform] ?? item.platform}
                </p>
              </div>
              <p className="price-tag cut cut-tag shrink-0 text-base">{formatPrice(item.unit_price)}</p>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge tone={item.delivery_status === "delivered" ? "trust" : "neutral"}>{item.delivery_status === "delivered" ? "Delivered" : "Not delivered yet"}</Badge>
              {item.delivery_status === "pending" && live && item.eta_minutes && <span className="text-xs text-text-muted">Usually {etaLabel(item.eta_minutes)}</span>}
              {item.rental_returned_at && <Badge>Returned</Badge>}
            </div>
            {item.kind === "rent" && item.rental_starts_at && item.rental_ends_at && (
              <p className="mt-2 text-xs text-text-muted">Rental: {formatDate(item.rental_starts_at)} to {formatDate(item.rental_ends_at)}</p>
            )}
            {live && item.delivery_status === "delivered" && !item.rental_returned_at && <Delivery itemId={item.id} />}
            {live && item.delivery_status === "delivered" && reviews && (reviews.has(item.id) ? <YourReview review={reviews.get(item.id)!} /> : <ReviewForm itemId={item.id} onDone={reload} />)}
          </li>
        ))}
      </ul>

      <dl className="panel flex flex-col gap-2 p-4 text-sm">
        <div className="flex justify-between"><dt className="text-text-muted">Subtotal</dt><dd className="text-text-primary">{formatPrice(order.subtotal)}</dd></div>
        {order.discount > 0 && <div className="flex justify-between"><dt className="text-text-muted">Discount{order.coupon_code ? ` (${order.coupon_code})` : ""}</dt><dd className="font-semibold text-trust-600">− {formatPrice(order.discount)}</dd></div>}
        <div className="flex items-center justify-between border-t border-dashed border-border-strong pt-3 text-base font-bold"><dt className="text-text-primary">Total</dt><dd className="font-display text-2xl font-bold text-text-primary">{formatPrice(order.total)}</dd></div>
      </dl>

      <div className="print:hidden">
        <Link to={`/account/support?order=${order.id}`} className="flex min-h-11 items-center text-sm font-semibold text-brand-400">Something wrong with this order? Get help</Link>
      </div>

      {order.receipt_no && (
        <section aria-label="Receipt" className="panel p-4 text-sm text-text-muted">
          <h2 className="font-display text-base font-bold text-text-primary">Receipt {order.receipt_no}</h2>
          {business.length > 0 && <p className="mt-1">{business.join(" · ")}</p>}
          <p className="mt-1">Billed to {order.contact_name ?? "customer"}{order.contact_phone ? ` · +${order.contact_phone}` : ""}{order.paid_at ? ` · Paid ${formatDate(order.paid_at)}` : ""}</p>
          <div className="mt-3 print:hidden"><Button variant="secondary" onClick={() => window.print()}>Print or save as PDF</Button></div>
        </section>
      )}
    </div>
  );
}

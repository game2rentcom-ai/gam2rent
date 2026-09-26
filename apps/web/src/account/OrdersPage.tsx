import type { SupabaseClient } from "@supabase/supabase-js";
import { Link } from "react-router-dom";
import { ok, useLoad } from "../lib/api";
import { Badge } from "../ui/Chip";
import { Button } from "../ui/Button";
import { Notice } from "../ui/Form";
import { formatPrice } from "../ui/format";
import { IconChevron } from "../ui/icons";
import { STATUS_LABEL, formatDate, orderName, type Order, type OrderItem } from "../shop/orders";

async function loadOrders(client: SupabaseClient) {
  const orders = (await ok(client.from("orders").select("*").order("created_at", { ascending: false }).limit(50))) as Order[];
  const items = orders.length
    ? ((await ok(client.from("order_items").select("order_id,title").in("order_id", orders.map((o) => o.id)))) as Pick<OrderItem, "order_id" | "title">[])
    : [];
  const titles = new Map<string, string[]>();
  for (const item of items) titles.set(item.order_id, [...(titles.get(item.order_id) ?? []), item.title]);
  return { orders, titles };
}

export function OrdersPage() {
  const { data, error, loading, reload } = useLoad(loadOrders, undefined);
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 py-2 sm:py-6">
      <header>
        <Link to="/account" className="-ml-2 inline-flex min-h-11 items-center rounded-lg px-2 text-sm font-semibold text-text-muted hover:text-text-primary">← My account</Link>
        <h1 className="font-display text-3xl font-bold text-text-primary">My orders</h1>
      </header>
      {loading && <div className="h-40 animate-pulse rounded-2xl bg-bg-surface" aria-busy="true" aria-label="Loading your orders" />}
      {error && <Notice tone="error" onRetry={reload}>{error}</Notice>}
      {data && data.orders.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border-strong px-4 py-12 text-center">
          <p className="text-sm text-text-muted">You haven’t ordered anything yet.</p>
          <Button to="/browse">Browse games</Button>
        </div>
      )}
      <ul className="flex flex-col gap-3">
        {data?.orders.map((o) => {
          const status = STATUS_LABEL[o.status];
          return (
            <li key={o.id}>
              <Link to={`/account/orders/${o.id}`} className="panel panel-link flex min-h-20 items-center gap-3 p-4">
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-display text-sm font-bold text-text-primary">{orderName(o)}</span>
                    <Badge tone={status.tone}>{status.label}</Badge>
                  </span>
                  <span className="mt-1 block truncate text-sm text-text-muted">{(data.titles.get(o.id) ?? []).join(", ")}</span>
                  <span className="text-xs text-text-muted">{formatDate(o.created_at)} · {formatPrice(o.total)}</span>
                </span>
                <IconChevron className="h-5 w-5 shrink-0 text-text-muted" />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

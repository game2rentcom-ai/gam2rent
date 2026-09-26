import type { SupabaseClient } from "@supabase/supabase-js";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ok, useLoad } from "../../lib/api";
import { STATUS_LABEL, formatDateTime, orderName, type Order, type OrderItem } from "../../shop/orders";
import { Badge, Chip } from "../../ui/Chip";
import { Button } from "../../ui/Button";
import { formatPrice } from "../../ui/format";
import { IconSearch } from "../../ui/icons";
import { ErrorNote, Loading, PageHeader } from "../kit";
import { ManualOrder } from "./ManualOrder";

// Every order, newest first — or, under "To deliver", oldest first, so the customer who has waited
// longest is at the top. Tap an order to deliver it, change its status, or refund it.
type Filter = "todo" | "unpaid" | "done" | "closed" | "all";
const FILTERS: [Filter, string][] = [["todo", "To deliver"], ["unpaid", "Waiting for payment"], ["done", "Delivered"], ["closed", "Cancelled or refunded"], ["all", "All"]];
const MATCH: Record<Filter, (o: Order) => boolean> = {
  todo: (o) => o.status === "paid" || o.status === "in_progress",
  unpaid: (o) => o.status === "pending_payment",
  done: (o) => o.status === "delivered",
  closed: (o) => o.status === "cancelled" || o.status === "refunded",
  all: () => true,
};

async function loadOrders(client: SupabaseClient) {
  const orders = (await ok(client.from("orders").select("*").order("created_at", { ascending: false }).limit(300))) as Order[];
  const items = orders.length ? ((await ok(client.from("order_items").select("order_id,title").in("order_id", orders.map((o) => o.id)))) as Pick<OrderItem, "order_id" | "title">[]) : [];
  const titles = new Map<string, string[]>();
  for (const item of items) titles.set(item.order_id, [...(titles.get(item.order_id) ?? []), item.title]);
  return { orders, titles };
}

export function AdminOrdersPage() {
  const { data, error, loading } = useLoad(loadOrders, undefined);
  const [filter, setFilter] = useState<Filter>("todo");
  const [query, setQuery] = useState("");
  const [recording, setRecording] = useState(false);

  const rows = useMemo(() => {
    if (!data) return [];
    const needle = query.trim().toLowerCase();
    const list = data.orders.filter(MATCH[filter]).filter((o) => {
      if (!needle) return true;
      const haystack = [orderName(o), o.contact_name, o.contact_phone, ...(data.titles.get(o.id) ?? [])].join(" ").toLowerCase();
      return haystack.includes(needle);
    });
    return filter === "todo" ? [...list].reverse() : list;
  }, [data, filter, query]);

  if (loading) return <Loading />;
  if (error || !data) return <ErrorNote message={error ?? "Couldn’t load the orders."} />;
  const count = (f: Filter) => data.orders.filter(MATCH[f]).length;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Orders" subtitle="Deliver paid orders here, and record sales made on WhatsApp." actions={<Button variant="secondary" onClick={() => setRecording((r) => !r)}>{recording ? "Close" : "Record a sale"}</Button>} />
      {recording && <ManualOrder />}
      <div className="relative">
        <IconSearch className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by receipt, name, phone or game"
          aria-label="Search orders"
          className="min-h-11 w-full rounded-xl border border-border-subtle bg-bg-surface pl-11 pr-4 text-base text-text-primary outline-none placeholder:text-text-muted focus:border-brand-500"
        />
      </div>
      <div role="group" aria-label="Show" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {FILTERS.map(([value, label]) => <Chip key={value} selected={filter === value} onClick={() => setFilter(value)}>{label} · {count(value)}</Chip>)}
      </div>
      {rows.length === 0 && <p className="rounded-2xl border border-dashed border-border-subtle px-4 py-8 text-center text-sm text-text-muted">{filter === "todo" ? "Nothing waiting for delivery." : "No orders here."}</p>}
      <ul className="flex flex-col gap-2">
        {rows.map((o) => {
          const status = STATUS_LABEL[o.status];
          return (
            <li key={o.id}>
              <Link to={`/admin/orders/${o.id}`} className="flex min-h-20 flex-col gap-1 rounded-xl border border-white/10 bg-bg-surface px-4 py-3 hover:border-brand-500/50">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold text-text-primary">{orderName(o)}</span>
                  <Badge tone={status.tone}>{status.label}</Badge>
                  {o.payment_source !== "razorpay" && <Badge>{o.payment_source === "manual" ? "Recorded by hand" : "Free"}</Badge>}
                  <span className="ml-auto text-sm font-semibold text-text-primary">{formatPrice(o.total)}</span>
                </span>
                <span className="truncate text-sm text-text-muted">{(data.titles.get(o.id) ?? []).join(", ")}</span>
                <span className="text-xs text-text-muted">{o.contact_name ?? "Customer"}{o.contact_phone ? ` · +${o.contact_phone}` : ""} · {formatDateTime(o.created_at)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

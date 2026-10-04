import type { SupabaseClient } from "@supabase/supabase-js";
import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ok, useLoad } from "../../lib/api";
import { STATUS_LABEL, formatDateTime, orderName, type Order, type OrderItem } from "../../shop/orders";
import { Badge, Chip } from "../../ui/Chip";
import { Button } from "../../ui/Button";
import { formatPrice } from "../../ui/format";
import { IconSearch } from "../../ui/icons";
import { ErrorNote, Loading, PageHeader } from "../kit";
import { ManualOrder } from "./ManualOrder";

// Every order, newest first — or, under "To deliver", oldest first, so the customer who has waited
// longest is at the top. "Rentals due" lists rentals that have ended or end within two days and haven't been
// taken back yet, soonest first. Tap an order to deliver it, change its status, or refund it.
type Filter = "todo" | "rentals" | "unpaid" | "done" | "closed" | "all";
const FILTERS: [Filter, string][] = [["todo", "To deliver"], ["rentals", "Rentals due"], ["unpaid", "Waiting for payment"], ["done", "Delivered"], ["closed", "Cancelled or refunded"], ["all", "All"]];
const RENTAL_WARNING_MS = 48 * 3600 * 1000;
const BYTE_ORDER_MARK = String.fromCharCode(0xfeff);
const MATCH: Record<Filter, (o: Order, rentalEnds: Map<string, number>) => boolean> = {
  todo: (o) => o.status === "paid" || o.status === "in_progress",
  rentals: (o, rentalEnds) => rentalEnds.has(o.id),
  unpaid: (o) => o.status === "pending_payment",
  done: (o) => o.status === "delivered",
  closed: (o) => o.status === "cancelled" || o.status === "refunded",
  all: () => true,
};

type Line = Pick<OrderItem, "order_id" | "title" | "kind" | "rental_ends_at" | "rental_returned_at">;
const rentalEnd = (line: Line, now: number): number | null =>
  line.kind === "rent" && !line.rental_returned_at && line.rental_ends_at && new Date(line.rental_ends_at).getTime() < now + RENTAL_WARNING_MS ? new Date(line.rental_ends_at).getTime() : null;

async function loadOrders(client: SupabaseClient) {
  const orders = (await ok(client.from("orders").select("*").order("created_at", { ascending: false }).limit(300))) as Order[];
  const items = orders.length ? ((await ok(client.from("order_items").select("order_id,title,kind,rental_ends_at,rental_returned_at").in("order_id", orders.map((o) => o.id)))) as Line[]) : [];
  const titles = new Map<string, string[]>();
  for (const item of items) titles.set(item.order_id, [...(titles.get(item.order_id) ?? []), item.title]);
  // When each order's soonest unreturned rental ends (the same rule as the Overview's "Rentals ending soon")
  const rentalEnds = new Map<string, number>();
  const now = Date.now();
  for (const item of items) {
    const end = rentalEnd(item, now);
    if (end !== null) rentalEnds.set(item.order_id, Math.min(end, rentalEnds.get(item.order_id) ?? end));
  }
  return { orders, titles, rentalEnds, loadedAt: now };
}

// One row per order for the owner's accounts. A cell that starts with = + - or @ would run as a formula when the
// file is opened in a spreadsheet (a customer chose that name), so it gets a leading quote.
const csvCell = (value: unknown): string => {
  const text = value === null || value === undefined ? "" : String(value);
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

function downloadCsv(orders: Order[], titles: Map<string, string[]>) {
  const header = ["Receipt", "Placed", "Paid", "Status", "Total (INR)", "Total discount (INR)", "of which launch offer (INR)", "Coupon", "Payment", "Razorpay payment id", "Customer", "Phone", "Games"];
  const rows = orders.map((o) => [
    orderName(o), o.created_at, o.paid_at, o.status, o.total, o.discount, o.promo_discount, o.coupon_code, o.payment_source, o.razorpay_payment_id,
    o.contact_name, o.contact_phone ? `+${o.contact_phone}` : "", (titles.get(o.id) ?? []).join("; "),
  ]);
  const csv = [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
  const link = document.createElement("a");
  const url = URL.createObjectURL(new Blob([BYTE_ORDER_MARK, csv], { type: "text/csv;charset=utf-8" })); // the mark makes Excel read ₹ and Indian names correctly
  link.href = url;
  link.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

export function AdminOrdersPage() {
  const { data, error, loading, reload } = useLoad(loadOrders, undefined);
  const [params] = useSearchParams();
  const [filter, setFilter] = useState<Filter>(() => FILTERS.find(([value]) => value === params.get("show"))?.[0] ?? "todo");
  const [query, setQuery] = useState("");
  const [recording, setRecording] = useState(false);

  const rows = useMemo(() => {
    if (!data) return [];
    const needle = query.trim().toLowerCase();
    const list = data.orders.filter((o) => MATCH[filter](o, data.rentalEnds)).filter((o) => {
      if (!needle) return true;
      const haystack = [orderName(o), o.contact_name, o.contact_phone, ...(data.titles.get(o.id) ?? [])].join(" ").toLowerCase();
      return haystack.includes(needle);
    });
    if (filter === "rentals") return [...list].sort((a, b) => data.rentalEnds.get(a.id)! - data.rentalEnds.get(b.id)!);
    return filter === "todo" ? [...list].reverse() : list;
  }, [data, filter, query]);

  if (loading) return <Loading />;
  if (error || !data) return <ErrorNote message={error ?? "Couldn’t load the orders."} onRetry={reload} />;
  const count = (f: Filter) => data.orders.filter((o) => MATCH[f](o, data.rentalEnds)).length;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Orders"
        subtitle="Deliver paid orders here, and record sales made on WhatsApp."
        actions={
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => downloadCsv(data.orders, data.titles)}>Download CSV</Button>
            <Button variant="secondary" onClick={() => setRecording((r) => !r)}>{recording ? "Close" : "Record a sale"}</Button>
          </div>
        }
      />
      {recording && <ManualOrder />}
      <div className="relative">
        <IconSearch className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by receipt, name, phone or game"
          aria-label="Search orders"
          className="field bg-bg-surface pl-11 pr-4"
        />
      </div>
      <div role="group" aria-label="Show" className="no-scrollbar -mx-4 -my-2 flex gap-2 overflow-x-auto px-4 py-2 sm:mx-0 sm:px-0">
        {FILTERS.map(([value, label]) => <Chip key={value} selected={filter === value} onClick={() => setFilter(value)}>{label} · {count(value)}</Chip>)}
      </div>
      {rows.length === 0 && <p className="rounded-2xl border border-dashed border-border-subtle px-4 py-8 text-center text-sm text-text-muted">{filter === "todo" ? "Nothing waiting for delivery." : filter === "rentals" ? "No rentals are due back." : "No orders here."}</p>}
      <ul className="flex flex-col gap-2">
        {rows.map((o) => {
          const status = STATUS_LABEL[o.status];
          return (
            <li key={o.id}>
              <Link to={`/admin/orders/${o.id}`} className="panel panel-link flex min-h-20 flex-col gap-1 px-4 py-3">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold text-text-primary">{orderName(o)}</span>
                  <Badge tone={status.tone}>{status.label}</Badge>
                  {o.payment_source !== "razorpay" && <Badge>{o.payment_source === "manual" ? "Recorded by hand" : "Free"}</Badge>}
                  {data.rentalEnds.has(o.id) && (
                    <Badge tone="warn">{data.rentalEnds.get(o.id)! <= data.loadedAt ? "Rental ended" : `Rental ends ${formatDateTime(new Date(data.rentalEnds.get(o.id)!).toISOString())}`}</Badge>
                  )}
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

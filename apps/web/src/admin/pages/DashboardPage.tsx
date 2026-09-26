import type { SupabaseClient } from "@supabase/supabase-js";
import { Link } from "react-router-dom";
import { formatPrice } from "../../ui/format";
import { IconCheck, IconChevron } from "../../ui/icons";
import { useLoad } from "../../lib/api";
import { Card, ErrorNote, Loading, PageHeader } from "../kit";

interface Stats {
  orders_today: number; revenue_today: number; revenue_7d: number; revenue_30d: number;
  awaiting_delivery: number; open_tickets: number; open_requests: number; rentals_ending: number;
  top_games: { title: string; orders: number }[];
}

async function loadOverview(client: SupabaseClient) {
  const count = async (table: string, apply?: (q: ReturnType<ReturnType<SupabaseClient["from"]>["select"]>) => unknown) => {
    const query = client.from(table).select("*", { count: "exact", head: true });
    const { count: n } = await ((apply ? apply(query) : query) as PromiseLike<{ count: number | null }>);
    return n ?? 0;
  };
  const [games, hidden, listings, plans, reviews, settings, stats] = await Promise.all([
    count("games"),
    count("games", (q) => q.eq("is_published", false)),
    count("listings"),
    count("rental_plans"),
    count("reviews"),
    client.from("site_settings").select("key,value"),
    client.rpc("admin_dashboard"),
  ]);
  const values = Object.fromEntries(((settings.data ?? []) as { key: string; value: unknown }[]).map((s) => [s.key, s.value]));
  return { games, hidden, listings, plans, reviews, values, stats: stats.error ? null : (stats.data as Stats) };
}

export function DashboardPage() {
  const { data, error, loading, reload } = useLoad(loadOverview, undefined);
  if (loading) return <Loading />;
  if (error || !data) return <ErrorNote message={error ?? "Couldn’t load the overview."} onRetry={reload} />;

  const steps = [
    { done: Boolean(data.values.contact_whatsapp), label: "Set your contact number", to: "/admin/settings" },
    { done: Boolean(data.values.business_name && data.values.business_address && data.values.support_email), label: "Add your business details (shown on receipts and the legal pages)", to: "/admin/settings" },
    { done: data.listings > 0, label: "Add your first game price", to: "/admin/pricing" },
    { done: data.plans > 0, label: "Set your rental plans", to: "/admin/pricing" },
    { done: data.values.payments_enabled === "true", label: "Switch on online payments (after a successful test purchase)", to: "/admin/settings" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Overview" subtitle="Everything on the store is edited from here." />

      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["Games", data.games, `${data.hidden} hidden`, "/admin/games"],
          ["With a price", data.listings, "buyable now", "/admin/pricing"],
          ["Rental plans", data.plans, "store-wide", "/admin/pricing"],
          ["Reviews", data.reviews, "on the site", "/admin/reviews"],
        ].map(([label, value, note, to]) => (
          <li key={String(label)}>
            <Link to={String(to)} className="panel panel-link block p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">{label}</p>
              <p className="mt-1 font-display text-3xl font-bold text-text-primary">{value}</p>
              <p className="text-xs text-text-muted">{note}</p>
            </Link>
          </li>
        ))}
      </ul>

      <Card>
        <h2 className="font-display text-lg font-bold text-text-primary">Getting started</h2>
        <ul className="mt-3 flex flex-col">
          {steps.map((s) => (
            <li key={s.label}>
              <Link to={s.to} className="flex min-h-12 items-center gap-3 rounded-xl px-1 hover:bg-white/5">
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${s.done ? "border-trust-600 bg-trust-600 text-black" : "border-border-strong text-transparent"}`}><IconCheck className="h-4 w-4" /></span>
                <span className={`flex-1 text-sm ${s.done ? "text-text-muted line-through" : "font-semibold text-text-primary"}`}>{s.label}</span>
                <IconChevron className="h-4 w-4 text-text-muted" />
              </Link>
            </li>
          ))}
        </ul>
      </Card>

      {data.stats ? (
        <Card>
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-lg font-bold text-text-primary">Orders</h2>
            <Link to="/admin/orders" className="flex min-h-11 items-center px-2 text-sm font-semibold text-brand-400">Open orders</Link>
          </div>
          <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {([
              ["Orders today", data.stats.orders_today, "/admin/orders"],
              ["Revenue today", formatPrice(data.stats.revenue_today)],
              ["Last 7 days", formatPrice(data.stats.revenue_7d)],
              ["Last 30 days", formatPrice(data.stats.revenue_30d)],
              ["Awaiting delivery", data.stats.awaiting_delivery, "/admin/orders"],
              ["Open tickets", data.stats.open_tickets, "/admin/support"],
              ["Rentals ending soon", data.stats.rentals_ending, "/admin/orders?show=rentals"],
              ["Game requests", data.stats.open_requests, "/admin/requests"],
            ] as [string, string | number, string?][]).map(([k, v, to]) => (
              <div key={k}>
                <dt className="text-xs text-text-muted">{k}</dt>
                <dd className="font-display text-lg font-bold text-text-primary">{to ? <Link to={to} className="-my-2 flex min-h-11 items-center hover:text-brand-400">{v}</Link> : v}</dd>
              </div>
            ))}
          </dl>
          {data.stats.top_games.length > 0 && (
            <div className="mt-4 border-t border-border-subtle pt-3">
              <h3 className="text-sm font-semibold text-text-primary">Best sellers, last 30 days</h3>
              <ol className="mt-1 flex flex-col text-sm text-text-muted">
                {data.stats.top_games.map((g) => <li key={g.title} className="flex justify-between gap-3 py-1"><span className="min-w-0 truncate">{g.title}</span><span className="shrink-0 font-semibold text-text-primary">{g.orders}</span></li>)}
              </ol>
            </div>
          )}
        </Card>
      ) : (
        <p className="rounded-2xl border border-dashed border-border-strong px-4 py-6 text-center text-sm text-text-muted">Orders, tickets and revenue will appear here once online ordering is switched on.</p>
      )}
    </div>
  );
}

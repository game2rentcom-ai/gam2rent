import type { SupabaseClient } from "@supabase/supabase-js";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ok, useLoad } from "../../lib/api";
import { formatDateTime } from "../../shop/orders";
import { TICKET_STATUS, categoryLabel, type Ticket } from "../../support/tickets";
import { Badge, Chip } from "../../ui/Chip";
import { ErrorNote, Loading, PageHeader } from "../kit";

// Customers' support requests. "Needs a reply" lists the ones still open, the one waiting longest first.
type Filter = "open" | "resolved" | "closed" | "all";
const FILTERS: [Filter, string][] = [["open", "Needs a reply"], ["resolved", "Resolved"], ["closed", "Closed"], ["all", "All"]];
const MATCH: Record<Filter, (t: Ticket) => boolean> = {
  open: (t) => t.status === "open" || t.status === "in_progress",
  resolved: (t) => t.status === "resolved",
  closed: (t) => t.status === "closed",
  all: () => true,
};

async function loadTickets(client: SupabaseClient) {
  const tickets = (await ok(client.from("support_tickets").select("*").order("last_message_at", { ascending: false }).limit(200))) as Ticket[];
  const ids = [...new Set(tickets.map((t) => t.user_id))];
  const people = ids.length ? ((await ok(client.from("profiles").select("id,full_name").in("id", ids))) as { id: string; full_name: string | null }[]) : [];
  return { tickets, names: new Map(people.map((p) => [p.id, p.full_name ?? "Customer"])) };
}

export function AdminSupportPage() {
  const { data, error, loading } = useLoad(loadTickets, undefined);
  const [filter, setFilter] = useState<Filter>("open");
  const rows = useMemo(() => {
    if (!data) return [];
    const list = data.tickets.filter(MATCH[filter]);
    return filter === "open" ? [...list].reverse() : list;
  }, [data, filter]);
  if (loading) return <Loading />;
  if (error || !data) return <ErrorNote message={error ?? "Couldn’t load the requests."} />;
  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Support" subtitle="Questions and problems from customers." />
      <div role="group" aria-label="Show" className="no-scrollbar -mx-4 -my-2 flex gap-2 overflow-x-auto px-4 py-2 sm:mx-0 sm:px-0">
        {FILTERS.map(([value, label]) => <Chip key={value} selected={filter === value} onClick={() => setFilter(value)}>{label} · {data.tickets.filter(MATCH[value]).length}</Chip>)}
      </div>
      {rows.length === 0 && <p className="rounded-2xl border border-dashed border-border-subtle px-4 py-8 text-center text-sm text-text-muted">{filter === "open" ? "Nothing waiting for a reply." : "Nothing here."}</p>}
      <ul className="flex flex-col gap-2">
        {rows.map((t) => {
          const status = TICKET_STATUS[t.status];
          return (
            <li key={t.id}>
              <Link to={`/admin/support/${t.id}`} className="panel panel-link flex min-h-16 flex-col gap-1 px-4 py-3">
                <span className="flex flex-wrap items-center gap-2"><span className="text-sm font-bold text-text-primary">{t.subject}</span><Badge tone={status.tone}>{status.label}</Badge></span>
                <span className="text-xs text-text-muted">{data.names.get(t.user_id) ?? "Customer"} · {categoryLabel(t.category)} · {formatDateTime(t.last_message_at)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

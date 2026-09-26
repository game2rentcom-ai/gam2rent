import type { SupabaseClient } from "@supabase/supabase-js";
import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../auth/context";
import { useStore } from "../data/store";
import { ok, useAction, useLoad } from "../lib/api";
import { formatDate, orderName, type Order } from "../shop/orders";
import { CATEGORIES, TICKET_STATUS, categoryLabel, ticketProblem, type Ticket, type TicketCategory } from "../support/tickets";
import { Badge } from "../ui/Chip";
import { Button } from "../ui/Button";
import { Notice, SelectField, TextAreaField, TextField } from "../ui/Form";
import { IconChevron } from "../ui/icons";

// The customer's help desk: what they've asked, and a form to ask something new. Replies from the owner
// appear on the request's page.
async function loadSupport(client: SupabaseClient) {
  const [tickets, orders] = await Promise.all([
    ok(client.from("support_tickets").select("*").order("last_message_at", { ascending: false }).limit(50)),
    ok(client.from("orders").select("id,receipt_no,created_at").order("created_at", { ascending: false }).limit(30)),
  ]);
  return { tickets: tickets as Ticket[], orders: orders as Pick<Order, "id" | "receipt_no" | "created_at">[] };
}

export function SupportPage() {
  const { data, error, loading, reload } = useLoad(loadSupport, undefined);
  const { contactLink } = useStore();
  const chat = contactLink("Hi! I need some help.");
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 py-2 sm:py-6">
      <header>
        <Link to="/account" className="-ml-2 inline-flex min-h-11 items-center rounded-lg px-2 text-sm font-semibold text-text-muted hover:text-text-primary">← My account</Link>
        <h1 className="font-display text-3xl font-black text-text-primary">Help & support</h1>
        <p className="mt-1 text-sm text-text-muted">Something wrong with a game, or a question about a payment? Tell us here and we’ll reply on this page.</p>
      </header>
      {loading && <div className="h-40 animate-pulse rounded-2xl bg-bg-surface" aria-busy="true" aria-label="Loading" />}
      {error && (
        <Notice tone="error">
          Support requests aren’t available right now. {chat && <a href={chat} target="_blank" rel="noopener noreferrer" className="link-tap font-semibold underline">Message us on WhatsApp</a>}
        </Notice>
      )}
      {data && (
        <>
          <NewRequest orders={data.orders} onCreated={reload} />
          <h2 className="font-display text-lg font-bold text-text-primary">Your requests</h2>
          {data.tickets.length === 0 && <p className="rounded-2xl border border-dashed border-border-subtle px-4 py-8 text-center text-sm text-text-muted">No requests yet.</p>}
          <ul className="flex flex-col gap-2">
            {data.tickets.map((t) => {
              const status = TICKET_STATUS[t.status];
              return (
                <li key={t.id}>
                  <Link to={`/account/support/${t.id}`} className="flex min-h-16 items-center gap-3 rounded-2xl border border-white/10 bg-bg-surface p-4 hover:border-brand-500/50">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold text-text-primary">{t.subject}</span>
                      <span className="mt-1 flex flex-wrap items-center gap-2 text-xs text-text-muted"><Badge tone={status.tone}>{status.label}</Badge>{categoryLabel(t.category)} · {formatDate(t.last_message_at)}</span>
                    </span>
                    <IconChevron className="h-5 w-5 shrink-0 text-text-muted" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}

function NewRequest({ orders, onCreated }: { orders: Pick<Order, "id" | "receipt_no" | "created_at">[]; onCreated: () => void }) {
  const { client } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const preset = params.get("order") ?? "";
  const { busy, message, run } = useAction();
  const [open, setOpen] = useState(Boolean(preset));
  const [form, setForm] = useState({ subject: "", category: (preset ? "order_issue" : "general_question") as TicketCategory, order: orders.some((o) => o.id === preset) ? preset : "", message: "" });
  const [problem, setProblem] = useState("");
  const set = (key: keyof typeof form, value: string) => setForm((f) => ({ ...f, [key]: value }));

  if (!open) return <div><Button onClick={() => setOpen(true)}>New request</Button></div>;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.subject.trim()) return setProblem("Give your request a short title.");
    if (!form.message.trim()) return setProblem("Tell us what’s happening.");
    setProblem("");
    let created = "";
    const sent = await run(async () => {
      try {
        created = String(await ok((await client()).rpc("open_ticket", { p_subject: form.subject.trim(), p_category: form.category, p_order: form.order || null, p_message: form.message.trim() })));
      } catch (e) {
        throw new Error(ticketProblem(e instanceof Error ? e.message : ""));
      }
    }, "Sent.");
    if (sent) {
      onCreated();
      navigate(`/account/support/${created}`);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-bg-surface p-4 sm:p-5" noValidate aria-label="New request">
      <h2 className="font-display text-lg font-bold text-text-primary">New request</h2>
      {(problem || message?.tone === "error") && <Notice tone="error">{problem || message!.text}</Notice>}
      <TextField label="Title" hint="e.g. “My login isn’t working”" maxLength={120} value={form.subject} onChange={(e) => set("subject", e.target.value)} />
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField label="What is it about?" value={form.category} onChange={(e) => set("category", e.target.value)}>
          {CATEGORIES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </SelectField>
        <SelectField label="Which order?" value={form.order} onChange={(e) => set("order", e.target.value)}>
          <option value="">Not about an order</option>
          {orders.map((o) => <option key={o.id} value={o.id}>{orderName(o)} · {formatDate(o.created_at)}</option>)}
        </SelectField>
      </div>
      <TextAreaField label="Tell us what’s happening" maxLength={4000} value={form.message} onChange={(e) => set("message", e.target.value)} />
      <div className="flex gap-2">
        <Button type="submit" size="lg" disabled={busy}>{busy ? "Sending…" : "Send"}</Button>
        <Button variant="ghost" size="lg" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </form>
  );
}

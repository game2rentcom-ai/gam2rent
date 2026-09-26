import type { SupabaseClient } from "@supabase/supabase-js";
import { Link, useParams } from "react-router-dom";
import { isUuid, ok, useLoad } from "../lib/api";
import { orderName } from "../shop/orders";
import { RESOLUTION_TEXT, TICKET_STATUS, categoryLabel, type Ticket, type TicketMessage } from "../support/tickets";
import { Thread } from "../support/Thread";
import { Badge } from "../ui/Chip";
import { Button } from "../ui/Button";
import { Notice } from "../ui/Form";

async function loadTicket(client: SupabaseClient, id: string) {
  if (!isUuid(id)) return null;
  const ticket =(await ok(client.from("support_tickets").select("*").eq("id", id).maybeSingle())) as Ticket | null;
  if (!ticket) return null;
  const [messages, order] = await Promise.all([
    ok(client.from("ticket_messages").select("*").eq("ticket_id", id).order("created_at")),
    ticket.order_id ? ok(client.from("orders").select("id,receipt_no").eq("id", ticket.order_id).maybeSingle()) : Promise.resolve(null),
  ]);
  return { ticket, messages: messages as TicketMessage[], order: order as { id: string; receipt_no: string | null } | null };
}

export function TicketPage() {
  const { id = "" } = useParams();
  const { data, error, loading, reload } = useLoad(loadTicket, id);
  if (loading) return <div className="h-64 animate-pulse rounded-2xl bg-bg-surface" aria-busy="true" aria-label="Loading" />;
  if (error) return <Notice tone="error" onRetry={reload}>{error}</Notice>;
  if (!data) return <Notice tone="error">We couldn’t find that request.</Notice>;
  const { ticket, messages, order } = data;
  const status = TICKET_STATUS[ticket.status];
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 py-2 sm:py-6">
      <Link to="/account/support" className="-ml-2 inline-flex min-h-11 items-center self-start rounded-lg px-2 text-sm font-semibold text-text-muted hover:text-text-primary">← Help & support</Link>
      <header className="flex flex-col gap-2">
        <h1 className="font-display text-2xl font-bold text-text-primary sm:text-3xl">{ticket.subject}</h1>
        <p className="flex flex-wrap items-center gap-2 text-sm text-text-muted">
          <Badge tone={status.tone}>{status.label}</Badge>
          {categoryLabel(ticket.category)}
          {order && <>· <Link to={`/account/orders/${order.id}`} className="link-tap font-semibold text-brand-400">Order {orderName(order)}</Link></>}
        </p>
      </header>
      {ticket.resolution && RESOLUTION_TEXT[ticket.resolution] && <Notice tone={ticket.resolution === "rejected" ? "info" : "success"}>{RESOLUTION_TEXT[ticket.resolution]}</Notice>}
      <Thread ticketId={ticket.id} messages={messages} viewer="customer" closed={ticket.status === "closed"} onSent={reload} />
      <div><Button variant="ghost" onClick={reload}>Check for replies</Button></div>
    </div>
  );
}

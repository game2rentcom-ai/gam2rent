import type { SupabaseClient } from "@supabase/supabase-js";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../../auth/context";
import { ok, useAction, useLoad } from "../../lib/api";
import { orderName } from "../../shop/orders";
import { REASONS, RESOLUTIONS, TICKET_STATUS, categoryLabel, type Ticket, type TicketMessage, type TicketStatus } from "../../support/tickets";
import { Thread } from "../../support/Thread";
import { Badge } from "../../ui/Chip";
import { Button } from "../../ui/Button";
import { Notice, SelectField } from "../../ui/Form";
import { Card, ErrorNote, Loading, PageHeader } from "../kit";

async function loadTicket(client: SupabaseClient, id: string) {
  const ticket = (await ok(client.from("support_tickets").select("*").eq("id", id).maybeSingle())) as Ticket | null;
  if (!ticket) return null;
  const [messages, person, order] = await Promise.all([
    ok(client.from("ticket_messages").select("*").eq("ticket_id", id).order("created_at")),
    ok(client.from("profiles").select("full_name,phone").eq("id", ticket.user_id).maybeSingle()),
    ticket.order_id ? ok(client.from("orders").select("id,receipt_no").eq("id", ticket.order_id).maybeSingle()) : Promise.resolve(null),
  ]);
  return { ticket, messages: messages as TicketMessage[], person: person as { full_name: string | null; phone: string | null } | null, order: order as { id: string; receipt_no: string | null } | null };
}

export function AdminTicketPage() {
  const { id = "" } = useParams();
  const { data, error, loading, reload } = useLoad(loadTicket, id);
  if (loading) return <Loading />;
  if (error) return <ErrorNote message={error} onRetry={reload} />;
  if (!data) return <ErrorNote message="That request doesn’t exist." />;
  const { ticket, messages, person, order } = data;
  const status = TICKET_STATUS[ticket.status];
  return (
    <div className="flex flex-col gap-5">
      <Link to="/admin/support" className="-ml-2 inline-flex min-h-11 items-center self-start rounded-lg px-2 text-sm font-semibold text-text-muted hover:text-text-primary">← All requests</Link>
      <PageHeader title={ticket.subject} subtitle={`${categoryLabel(ticket.category)}${order ? ` · order ${orderName(order)}` : ""}`} actions={<Badge tone={status.tone}>{status.label}</Badge>} />
      <Card className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-text-primary">{person?.full_name ?? "Customer"}</p>
          <p className="text-sm text-text-muted">{person?.phone ? `+${person.phone}` : "No phone number"}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {order && <Button to={`/admin/orders/${order.id}`} variant="secondary">Open the order</Button>}
          {person?.phone && <Button href={`https://wa.me/${person.phone}`} variant="secondary">WhatsApp</Button>}
        </div>
      </Card>
      <Thread ticketId={ticket.id} messages={messages} viewer="admin" closed={ticket.status === "closed"} onSent={reload} />
      <TicketControls ticket={ticket} onChanged={reload} />
    </div>
  );
}

function TicketControls({ ticket, onChanged }: { ticket: Ticket; onChanged: () => void }) {
  const { client } = useAuth();
  const { busy, message, run } = useAction();
  const [status, setStatus] = useState<TicketStatus>(ticket.status);
  const [reason, setReason] = useState(ticket.reason ?? "");
  const [resolution, setResolution] = useState(ticket.resolution ?? "");
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (await run(async () => ok((await client()).rpc("admin_update_ticket", { p_ticket: ticket.id, p_status: status, p_reason: reason || null, p_resolution: resolution || null })), "Updated.")) onChanged();
  };
  return (
    <Card>
      <form onSubmit={save} className="flex flex-col gap-4" aria-label="Update this request">
        <h2 className="font-display text-lg font-bold text-text-primary">Update this request</h2>
        {message && <Notice tone={message.tone}>{message.text}</Notice>}
        <div className="grid gap-4 sm:grid-cols-3">
          <SelectField label="Status" value={status} onChange={(e) => setStatus(e.target.value as TicketStatus)}>
            {(Object.keys(TICKET_STATUS) as TicketStatus[]).map((s) => <option key={s} value={s}>{TICKET_STATUS[s].label}</option>)}
          </SelectField>
          <SelectField label="What went wrong" value={reason} onChange={(e) => setReason(e.target.value)}>
            <option value="">Not set</option>
            {REASONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </SelectField>
          <SelectField label="Outcome" value={resolution} onChange={(e) => setResolution(e.target.value)}>
            <option value="">Not set</option>
            {RESOLUTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </SelectField>
        </div>
        <div><Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save"}</Button></div>
      </form>
    </Card>
  );
}

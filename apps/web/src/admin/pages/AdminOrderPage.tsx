import type { SupabaseClient } from "@supabase/supabase-js";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../../auth/context";
import { PLATFORM_LABEL, type Platform } from "../../data/catalogTypes";
import { isUuid, ok, useAction, useLoad } from "../../lib/api";
import { callFunction } from "../../shop/checkout";
import { Delivery } from "../../shop/Delivery";
import { STATUS_LABEL, formatDate, formatDateTime, orderName, type Order, type OrderItem, type OrderStatus } from "../../shop/orders";
import { Badge } from "../../ui/Chip";
import { Button } from "../../ui/Button";
import { Notice, SelectField, TextAreaField, TextField } from "../../ui/Form";
import { formatPrice } from "../../ui/format";
import { Card, ErrorNote, Loading, PageHeader } from "../kit";

async function loadOrder(client: SupabaseClient, id: string) {
  if (!isUuid(id)) return null;
  const order =(await ok(client.from("orders").select("*").eq("id", id).maybeSingle())) as Order | null;
  if (!order) return null;
  const items = (await ok(client.from("order_items").select("*").eq("order_id", id).order("title"))) as OrderItem[];
  return { order, items };
}

export function AdminOrderPage() {
  const { id = "" } = useParams();
  const { data, error, loading, reload } = useLoad(loadOrder, id);
  if (loading) return <Loading />;
  if (error) return <ErrorNote message={error} onRetry={reload} />;
  if (!data) return <ErrorNote message="That order doesn’t exist." />;
  const { order, items } = data;
  const status = STATUS_LABEL[order.status];
  const paid = order.status === "paid" || order.status === "in_progress" || order.status === "delivered";

  return (
    <div className="flex flex-col gap-5">
      <Link to="/admin/orders" className="-ml-2 inline-flex min-h-11 items-center self-start rounded-lg px-2 text-sm font-semibold text-text-muted hover:text-text-primary">← All orders</Link>
      <PageHeader title={`Order ${orderName(order)}`} subtitle={`Placed ${formatDateTime(order.created_at)}${order.paid_at ? ` · paid ${formatDateTime(order.paid_at)}` : ""}`} actions={<Badge tone={status.tone}>{status.label}</Badge>} />

      <Card className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-text-primary">{order.contact_name ?? "Customer"}</p>
            <p className="text-sm text-text-muted">{order.contact_phone ? `+${order.contact_phone}` : "No phone number"}</p>
          </div>
          {order.contact_phone && <Button href={`https://wa.me/${order.contact_phone}`} variant="secondary">Message on WhatsApp</Button>}
        </div>
        <p className="text-sm text-text-muted">
          {formatPrice(order.total)}{order.discount > 0 ? ` after ${formatPrice(order.discount)} off${order.promo_discount > 0 ? ` (${formatPrice(order.promo_discount)} from ${order.promo_title ?? "the launch offer"})` : ""}${order.coupon_code ? ` · code ${order.coupon_code}` : ""}` : ""} · {order.payment_source === "razorpay" ? "paid through Razorpay" : order.payment_source === "manual" ? "recorded by hand" : "free order"}
        </p>
        {order.razorpay_payment_id && (
          <p className="break-all text-xs text-text-muted">Razorpay payment <span className="font-mono text-text-primary">{order.razorpay_payment_id}</span>{order.razorpay_order_id ? <> · order <span className="font-mono">{order.razorpay_order_id}</span></> : null} — search for it in your Razorpay dashboard.</p>
        )}
      </Card>

      <ul className="flex flex-col gap-3">
        {items.map((item) => <li key={item.id}><ItemCard item={item} deliverable={paid} onChanged={reload} /></li>)}
      </ul>

      <OrderActions order={order} onChanged={reload} />
    </div>
  );
}

function ItemCard({ item, deliverable, onChanged }: { item: OrderItem; deliverable: boolean; onChanged: () => void }) {
  const { client } = useAuth();
  const { busy, message, run } = useAction();
  const [editing, setEditing] = useState(false);
  const delivered = item.delivery_status === "delivered";

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-text-primary">{item.title}</h2>
          <p className="text-xs text-text-muted">{item.kind === "rent" ? `Rent · ${item.plan_label}` : "Buy"} · {PLATFORM_LABEL[item.platform as Platform] ?? item.platform} · customer gets {item.credential_type === "qr_code" ? "a QR code" : "a login"}</p>
        </div>
        <p className="shrink-0 font-display text-base font-bold text-text-primary">{formatPrice(item.unit_price)}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Badge tone={delivered ? "trust" : "warn"}>{delivered ? `Delivered ${item.delivered_at ? formatDateTime(item.delivered_at) : ""}` : "Not delivered"}</Badge>
        {item.kind === "rent" && item.rental_starts_at && item.rental_ends_at && <Badge>{formatDate(item.rental_starts_at)} → {formatDate(item.rental_ends_at)}</Badge>}
        {item.rental_returned_at && <Badge>Returned</Badge>}
      </div>
      {message?.tone === "error" && <Notice tone="error">{message.text}</Notice>}

      {delivered && <Delivery itemId={item.id} buttonLabel="Show the details we sent (this is logged)" intro="What the customer can see." />}

      {deliverable && (!delivered || editing) && <DeliverForm item={item} replacing={delivered} onDone={() => { setEditing(false); onChanged(); }} />}
      {!deliverable && <p className="text-xs text-text-muted">Delivery opens once the order is paid.</p>}

      <div className="flex flex-wrap gap-2">
        {delivered && !editing && <Button variant="secondary" onClick={() => setEditing(true)}>Replace the details</Button>}
        {delivered && item.kind === "rent" && !item.rental_returned_at && (
          <Button variant="ghost" disabled={busy} onClick={() => void run(async () => ok((await client()).rpc("admin_mark_rental_returned", { p_item: item.id })), "Marked as returned.").then((done) => done && onChanged())}>Mark rental returned</Button>
        )}
      </div>
    </Card>
  );
}

const CREDENTIALS = [["id_password", "Login (ID and password)"], ["qr_code", "QR code or link"], ["other", "Something else"]] as const;

function DeliverForm({ item, replacing, onDone }: { item: OrderItem; replacing: boolean; onDone: () => void }) {
  const { client } = useAuth();
  const { busy, message, run } = useAction();
  const [type, setType] = useState<string>(item.credential_type ?? "id_password");
  const [values, setValues] = useState({ login: "", password: "", qr: "", text: "", note: "" });
  const [problem, setProblem] = useState("");
  const set = (key: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setValues((v) => ({ ...v, [key]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = type === "id_password" ? { login: values.login.trim(), password: values.password } : type === "qr_code" ? { qr: values.qr.trim() } : { text: values.text.trim() };
    if (Object.values(payload).some((v) => !v)) return setProblem(type === "id_password" ? "Enter both the login and the password." : "Enter the details to send.");
    setProblem("");
    const sent = await run(async () => callFunction(await client(), "deliver-order", { order_item_id: item.id, credential_type: type, payload, note: values.note }), replacing ? "Details replaced." : "Delivered — the customer can see it now.");
    if (sent) onDone();
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 rounded-xl border border-border-strong bg-bg-base p-3" noValidate aria-label={`Deliver ${item.title}`}>
      <p className="text-sm font-semibold text-text-primary">{replacing ? "Replace the details" : "Deliver this item"}</p>
      {(problem || message) && <Notice tone={problem ? "error" : message!.tone}>{problem || message!.text}</Notice>}
      <SelectField label="What the customer receives" value={type} onChange={(e) => setType(e.target.value)}>
        {CREDENTIALS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </SelectField>
      {type === "id_password" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <TextField label="Login (email or username)" autoComplete="off" value={values.login} onChange={set("login")} />
          <TextField label="Password" autoComplete="off" value={values.password} onChange={set("password")} />
        </div>
      )}
      {type === "qr_code" && <TextField label="QR code text or link" autoComplete="off" value={values.qr} onChange={set("qr")} />}
      {type === "other" && <TextAreaField label="Details" value={values.text} onChange={set("text")} />}
      <TextField label="Note for the customer" hint="Optional — shown with the details." value={values.note} onChange={set("note")} />
      <p className="text-xs text-text-muted">Stored encrypted. Only the customer and you can read it, and every time you read it is written to the history.</p>
      <div><Button type="submit" disabled={busy}>{busy ? "Sending…" : replacing ? "Replace details" : "Deliver"}</Button></div>
    </form>
  );
}

function OrderActions({ order, onChanged }: { order: Order; onChanged: () => void }) {
  const { client } = useAuth();
  const { busy, message, run } = useAction();
  const [confirm, setConfirm] = useState<"" | "cancel" | "refund">("");
  const setStatus = (status: OrderStatus, success: string) =>
    run(async () => ok((await client()).rpc("admin_set_order_status", { p_order: order.id, p_status: status })), success).then((done) => { setConfirm(""); if (done) onChanged(); });
  const refundViaRazorpay = () =>
    run(async () => callFunction(await client(), "refund-order", { order_id: order.id }), "Refunded through Razorpay.").then((done) => { setConfirm(""); if (done) onChanged(); });
  const live = order.status === "paid" || order.status === "in_progress";
  const canRefund = live || order.status === "delivered";

  // Once an order is cancelled or refunded there is nothing left to do — but the confirmation of what was just done stays.
  if (!canRefund && order.status !== "pending_payment" && !message) return null;
  return (
    <Card className="flex flex-col gap-3">
      <h2 className="font-display text-lg font-bold text-text-primary">Order actions</h2>
      {message && <Notice tone={message.tone}>{message.text}</Notice>}
      <div className="flex flex-wrap items-center gap-2">
        {order.status === "paid" && <Button variant="secondary" disabled={busy} onClick={() => void setStatus("in_progress", "Marked as being prepared.")}>Mark as being prepared</Button>}
        {order.status === "in_progress" && <Button variant="secondary" disabled={busy} onClick={() => void setStatus("paid", "Moved back to paid.")}>Move back to paid</Button>}
        {order.status === "pending_payment" && confirm !== "cancel" && <Button variant="ghost" onClick={() => setConfirm("cancel")}>Cancel this order…</Button>}
        {confirm === "cancel" && (
          <>
            <Button variant="secondary" disabled={busy} onClick={() => void setStatus("cancelled", "Order cancelled.")}>Yes, cancel it</Button>
            <Button variant="ghost" onClick={() => setConfirm("")}>Keep it</Button>
          </>
        )}
        {canRefund && confirm !== "refund" && <Button variant="ghost" onClick={() => setConfirm("refund")}>Refund…</Button>}
        {confirm === "refund" && (
          <>
            <Button variant="secondary" disabled={busy} onClick={() => void (order.payment_source === "razorpay" ? refundViaRazorpay() : setStatus("refunded", "Marked as refunded."))}>
              {order.payment_source === "razorpay" ? `Yes, refund ${formatPrice(order.total)} via Razorpay` : "Yes, mark as refunded"}
            </Button>
            <Button variant="ghost" onClick={() => setConfirm("")}>Cancel</Button>
          </>
        )}
      </div>
      {confirm === "refund" && order.payment_source !== "razorpay" && <p className="text-xs text-text-muted">This order wasn’t paid through Razorpay, so return the money yourself first; this only records it.</p>}
    </Card>
  );
}

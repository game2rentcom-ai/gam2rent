import type { SupabaseClient } from "@supabase/supabase-js";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/context";
import { PLATFORM_LABEL, type Platform } from "../../data/catalogTypes";
import { ok, toInt, useAction, useLoad } from "../../lib/api";
import { Button } from "../../ui/Button";
import { Notice, SelectField, TextField } from "../../ui/Form";
import { Card, ErrorNote, Loading } from "../kit";

// For a sale made outside the site (a WhatsApp chat, a UPI payment): record it against the customer's
// account so it gets a receipt, appears in their orders, and can be delivered from here. The customer
// must have an account — the database refuses an order for someone who doesn't.
interface Customer { id: string; full_name: string | null; phone: string | null }
interface GameOption { id: string; title: string; platforms: string[] }

async function loadContext(client: SupabaseClient) {
  const [customers, games] = await Promise.all([
    ok(client.from("profiles").select("id,full_name,phone").order("created_at", { ascending: false }).limit(500)),
    ok(client.from("games").select("id,title,platforms").order("title")),
  ]);
  return { customers: customers as Customer[], games: games as GameOption[] };
}

export function ManualOrder() {
  const { client } = useAuth();
  const navigate = useNavigate();
  const { busy, message, run } = useAction();
  const context = useLoad(loadContext, undefined);
  const [form, setForm] = useState({ customerFilter: "", customer: "", gameFilter: "", game: "", kind: "buy", platform: "", price: "", days: "", credential: "id_password", note: "" });
  const [problem, setProblem] = useState("");
  const set = (key: keyof typeof form, value: string) => setForm((f) => ({ ...f, [key]: value }));

  if (context.loading) return <Loading />;
  if (context.error || !context.data) return <ErrorNote message={context.error ?? "Couldn’t load."} />;
  const { customers, games } = context.data;
  const needle = form.customerFilter.trim().toLowerCase();
  const people = customers.filter((c) => !needle || `${c.full_name ?? ""} ${c.phone ?? ""}`.toLowerCase().includes(needle));
  const options = games.filter((g) => g.title.toLowerCase().includes(form.gameFilter.toLowerCase()));
  const game = games.find((g) => g.id === form.game);

  const record = async (e: React.FormEvent) => {
    e.preventDefault();
    const price = toInt(form.price);
    const days = form.kind === "rent" ? toInt(form.days) : null;
    if (!form.customer) return setProblem("Choose the customer.");
    if (!game) return setProblem("Choose the game.");
    if (price === null) return setProblem("Enter the price in whole rupees.");
    if (form.kind === "rent" && (!days || days < 1)) return setProblem("Enter how many days the rental lasts.");
    setProblem("");
    const item = {
      game_id: game.id, platform: form.platform || game.platforms[0], kind: form.kind, unit_price: price, credential_type: form.credential,
      ...(days ? { rental_days: days, plan_label: `${days} ${days === 1 ? "day" : "days"}` } : {}),
    };
    let created = "";
    const saved = await run(async () => {
      created = String(await ok((await client()).rpc("admin_create_manual_order", { p_user: form.customer, p_items: [item], p_note: form.note.trim() || null })));
    }, "Sale recorded.");
    if (saved) navigate(`/admin/orders/${created}`);
  };

  return (
    <Card>
      <form onSubmit={record} className="flex flex-col gap-4" noValidate aria-label="Record a sale">
        <h2 className="font-display text-lg font-bold text-text-primary">Record a sale</h2>
        {(problem || message) && <Notice tone={problem ? "error" : message!.tone}>{problem || message!.text}</Notice>}
        <TextField label="Find the customer" placeholder="Name or phone number" value={form.customerFilter} onChange={(e) => set("customerFilter", e.target.value)} />
        <SelectField label="Customer" value={form.customer} onChange={(e) => set("customer", e.target.value)}>
          <option value="">Choose a customer…</option>
          {people.map((c) => <option key={c.id} value={c.id}>{c.full_name ?? "No name"}{c.phone ? ` · +${c.phone}` : ""}</option>)}
        </SelectField>
        <TextField label="Find the game" placeholder="Start typing a title" value={form.gameFilter} onChange={(e) => set("gameFilter", e.target.value)} />
        <SelectField label="Game" value={form.game} onChange={(e) => { set("game", e.target.value); set("platform", ""); }}>
          <option value="">Choose a game…</option>
          {options.map((g) => <option key={g.id} value={g.id}>{g.title}</option>)}
        </SelectField>
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField label="Sale type" value={form.kind} onChange={(e) => set("kind", e.target.value)}>
            <option value="buy">Buy</option>
            <option value="rent">Rent</option>
          </SelectField>
          <SelectField label="Platform" value={form.platform || game?.platforms[0] || ""} onChange={(e) => set("platform", e.target.value)} disabled={!game}>
            {(game?.platforms ?? []).map((p) => <option key={p} value={p}>{PLATFORM_LABEL[p as Platform] ?? p}</option>)}
          </SelectField>
          <TextField label="Price paid (₹)" inputMode="numeric" value={form.price} onChange={(e) => set("price", e.target.value)} />
          {form.kind === "rent" && <TextField label="Rental days" inputMode="numeric" value={form.days} onChange={(e) => set("days", e.target.value)} />}
          <SelectField label="Customer receives" value={form.credential} onChange={(e) => set("credential", e.target.value)}>
            <option value="id_password">Login (ID and password)</option>
            <option value="qr_code">A scan-to-play code</option>
          </SelectField>
        </div>
        <TextField label="Note" hint="Optional — kept in the history, e.g. “paid by UPI, ref 1234”." value={form.note} onChange={(e) => set("note", e.target.value)} />
        <div><Button type="submit" size="lg" disabled={busy}>{busy ? "Recording…" : "Record sale"}</Button></div>
      </form>
    </Card>
  );
}

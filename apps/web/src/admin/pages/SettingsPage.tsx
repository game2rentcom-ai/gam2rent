import type { SupabaseClient } from "@supabase/supabase-js";
import { useState } from "react";
import { useAuth } from "../../auth/context";
import { formatPhone, normalizePhone } from "../../lib/phone";
import { Button } from "../../ui/Button";
import { Notice, SelectField, TextAreaField, TextField } from "../../ui/Form";
import { ok, toInt, useAction, useLoad } from "../../lib/api";
import { Card, ErrorNote, Loading, PageHeader, Toggle } from "../kit";

// Store-wide settings, kept in the database so changing them never needs a new release of the site.
// Everything here is PUBLIC (the storefront reads it) — never put a password or a secret key in it.
type Values = Record<string, string>;
const KEYS = [
  "announcement", "contact_whatsapp", "support_email", "business_name", "business_address", "gstin", "grievance_officer",
  "launch_offer_enabled", "launch_offer_title", "launch_offer_starts", "launch_offer_days", "launch_offer_max_free",
  "show_game_counts", "referral_free_game_id", "payments_enabled",
] as const;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const DEFAULT_OFFER_TITLE = "Buy one, get one free";

// What the owner is about to switch on, in words, before saving. The site works out the same window itself.
function offerPreview(values: Values): string | null {
  const days = toInt(values.launch_offer_days ?? "");
  if (!DATE.test(values.launch_offer_starts ?? "") || !days || days < 1) return null;
  const start = Date.parse(`${values.launch_offer_starts}T00:00:00+05:30`);
  const day = (ms: number) => new Date(ms).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" });
  return `Runs from ${day(start)} to ${day(start + days * 86_400_000 - 1)}, ${days} day${days === 1 ? "" : "s"}. It ends by itself.`;
}

interface Loaded { values: Values; games: { id: string; title: string }[] }

async function loadSettings(client: SupabaseClient): Promise<Loaded> {
  const [rows, games] = await Promise.all([
    ok(client.from("site_settings").select("key,value")) as Promise<{ key: string; value: unknown }[]>,
    ok(client.from("games").select("id,title").order("title")) as Promise<{ id: string; title: string }[]>,
  ]);
  return { values: Object.fromEntries(rows.filter((r) => typeof r.value === "string").map((r) => [r.key, r.value as string])), games };
}

export function SettingsPage() {
  const { data, error, loading, reload } = useLoad(loadSettings, undefined);
  if (loading) return <Loading />;
  if (error || !data) return <ErrorNote message={error ?? "Couldn’t load the settings."} onRetry={reload} />;
  return <SettingsForm initial={data.values} games={data.games} onSaved={reload} />;
}

function SettingsForm({ initial, games, onSaved }: { initial: Values; games: { id: string; title: string }[]; onSaved: () => void }) {
  const { client } = useAuth();
  const { busy, message, run } = useAction();
  const [values, setValues] = useState<Values>({ ...initial, contact_whatsapp: initial.contact_whatsapp ? formatPhone(initial.contact_whatsapp) : "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (key: string, value: string) => setValues((v) => ({ ...v, [key]: value }));
  const field = (key: string) => ({ value: values[key] ?? "", onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => set(key, e.target.value) });

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const found: Record<string, string> = {};
    const contact = (values.contact_whatsapp ?? "").trim() ? normalizePhone(values.contact_whatsapp) : "";
    if (contact === null) found.contact_whatsapp = "Enter a WhatsApp number with the country code, e.g. +91 98765 43210.";
    if ((values.support_email ?? "").trim() && !/^\S+@\S+\.\S+$/.test(values.support_email.trim())) found.support_email = "Enter a valid email address.";
    if (values.launch_offer_enabled === "true") {
      if (!DATE.test(values.launch_offer_starts ?? "")) found.launch_offer_starts = "Choose the first day of the offer.";
      const days = toInt(values.launch_offer_days ?? "");
      if (!days || days < 1 || days > 90) found.launch_offer_days = "Enter how many days it runs, from 1 to 90.";
      const free = toInt(values.launch_offer_max_free ?? "");
      if (free === null || free > 10) found.launch_offer_max_free = "Enter a number from 0 to 10. 0 switches the free game off.";
    }
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const next: Values = { ...values, contact_whatsapp: contact ?? "" };
    const changed = KEYS.filter((k) => (next[k] ?? "").trim() !== (initial[k] ?? "").trim());
    const saved = await run(async () => {
      const supabase = await client();
      const upserts = changed.filter((k) => (next[k] ?? "").trim() !== "").map((k) => ({ key: k, value: next[k].trim() }));
      const removals = changed.filter((k) => (next[k] ?? "").trim() === "");
      if (upserts.length) await ok(supabase.from("site_settings").upsert(upserts, { onConflict: "key" }));
      if (removals.length) await ok(supabase.from("site_settings").delete().in("key", removals));
    }, changed.length ? "Settings saved. They’re live on the store now." : "Nothing to save — no changes.");
    if (saved) onSaved();
  };

  return (
    <form onSubmit={save} className="flex flex-col gap-5" noValidate>
      <PageHeader title="Settings" subtitle="Store-wide details. These appear on the storefront." />
      {message && <Notice tone={message.tone}>{message.text}</Notice>}

      <Card className="flex flex-col gap-4">
        <h2 className="font-display text-lg font-bold text-text-primary">Announcement</h2>
        <TextField label="Banner text" hint="Shown at the very top of every page. Leave empty for no banner." {...field("announcement")} />
      </Card>

      <Card className="flex flex-col gap-4">
        <h2 className="font-display text-lg font-bold text-text-primary">Launch offer</h2>
        <p className="-mt-2 text-sm text-text-muted">Buy one game and get the cheaper one free. Customers see it at the top of every page and in their cart. It ends by itself.</p>
        <Toggle
          label="Run the offer"
          checked={values.launch_offer_enabled === "true"}
          onChange={(v) => set("launch_offer_enabled", v ? "true" : "false")}
        />
        <TextField label="Name shown to customers" hint={`Leave empty for “${DEFAULT_OFFER_TITLE}”.`} {...field("launch_offer_title")} />
        <div className="grid gap-4 sm:grid-cols-3">
          <TextField label="Starts on" type="date" error={errors.launch_offer_starts} {...field("launch_offer_starts")} />
          <TextField label="For how many days" inputMode="numeric" hint="e.g. 7 or 12" error={errors.launch_offer_days} {...field("launch_offer_days")} />
          <TextField label="Free games per order" inputMode="numeric" hint="1 keeps your cost down" error={errors.launch_offer_max_free} {...field("launch_offer_max_free")} />
        </div>
        {values.launch_offer_enabled === "true" && offerPreview(values) && <p className="text-sm font-semibold text-trust-600">{offerPreview(values)}</p>}
      </Card>

      <Card className="flex flex-col gap-4">
        <h2 className="font-display text-lg font-bold text-text-primary">Contact</h2>
        <TextField label="WhatsApp number" type="tel" inputMode="tel" hint="Customers’ Buy and Message buttons open a chat with this number." error={errors.contact_whatsapp} {...field("contact_whatsapp")} />
        <TextField label="Support email" type="email" inputMode="email" error={errors.support_email} {...field("support_email")} />
      </Card>

      <Card className="flex flex-col gap-4">
        <h2 className="font-display text-lg font-bold text-text-primary">Business details</h2>
        <p className="-mt-2 text-sm text-text-muted">Printed on receipts and shown on the Contact, Terms and Privacy pages. Razorpay asks for the same details.</p>
        <TextField label="Business name" {...field("business_name")} />
        <TextAreaField label="Address" {...field("business_address")} />
        <TextField label="GSTIN" hint="If you’re registered for GST." {...field("gstin")} />
        <TextField label="Grievance Officer" hint="The person customers can complain to, e.g. “Asha Rao, Proprietor”. Indian e-commerce rules ask for one." {...field("grievance_officer")} />
      </Card>

      <Card className="flex flex-col gap-2">
        <h2 className="font-display text-lg font-bold text-text-primary">Storefront</h2>
        <Toggle
          label="Show how many games there are"
          hint="Off keeps the numbers out of sight (“Search games”, no counts on platform tiles). Turn on only if a big number helps."
          checked={values.show_game_counts === "true"}
          onChange={(v) => set("show_game_counts", v ? "true" : "false")}
        />
      </Card>

      <Card className="flex flex-col gap-4">
        <h2 className="font-display text-lg font-bold text-text-primary">Referrals</h2>
        <p className="-mt-2 text-sm text-text-muted">When a customer has 5 friends who bought and has bought 5 games, they unlock this game free, plus a 95%-off code. Nothing unlocks until you choose the game.</p>
        <SelectField label="Free game for the reward" hint="Each customer gets a code for this game, usable once." value={values.referral_free_game_id ?? ""} onChange={(e) => set("referral_free_game_id", e.target.value)}>
          <option value="">Choose a game…</option>
          {games.map((g) => <option key={g.id} value={g.id}>{g.title}</option>)}
        </SelectField>
      </Card>

      <Card className="flex flex-col gap-2">
        <h2 className="font-display text-lg font-bold text-text-primary">Payments</h2>
        <Toggle
          label="Take payments online"
          hint="Turn on only after Razorpay is set up and a test purchase has worked. Until then, Buy and Rent open a chat with you."
          checked={values.payments_enabled === "true"}
          onChange={(v) => set("payments_enabled", v ? "true" : "false")}
        />
      </Card>

      <div><Button type="submit" size="lg" disabled={busy}>{busy ? "Saving…" : "Save settings"}</Button></div>
    </form>
  );
}

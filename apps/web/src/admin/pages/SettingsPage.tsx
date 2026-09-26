import type { SupabaseClient } from "@supabase/supabase-js";
import { useState } from "react";
import { useAuth } from "../../auth/context";
import { formatPhone, normalizePhone } from "../../lib/phone";
import { Button } from "../../ui/Button";
import { Notice, TextAreaField, TextField } from "../../ui/Form";
import { ok, useAction, useLoad } from "../../lib/api";
import { Card, ErrorNote, Loading, PageHeader, Toggle } from "../kit";

// Store-wide settings, kept in the database so changing them never needs a new release of the site.
// Everything here is PUBLIC (the storefront reads it) — never put a password or a secret key in it.
type Values = Record<string, string>;
const KEYS = ["announcement", "contact_whatsapp", "support_email", "business_name", "business_address", "gstin", "grievance_officer", "payments_enabled"] as const;

async function loadSettings(client: SupabaseClient): Promise<Values> {
  const rows = (await ok(client.from("site_settings").select("key,value"))) as { key: string; value: unknown }[];
  return Object.fromEntries(rows.filter((r) => typeof r.value === "string").map((r) => [r.key, r.value as string]));
}

export function SettingsPage() {
  const { data, error, loading, reload } = useLoad(loadSettings, undefined);
  if (loading) return <Loading />;
  if (error || !data) return <ErrorNote message={error ?? "Couldn’t load the settings."} />;
  return <SettingsForm initial={data} onSaved={reload} />;
}

function SettingsForm({ initial, onSaved }: { initial: Values; onSaved: () => void }) {
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

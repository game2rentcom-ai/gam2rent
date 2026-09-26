import type { SupabaseClient } from "@supabase/supabase-js";
import { useState } from "react";
import { useAuth } from "../../auth/context";
import { ok, toInt, useAction, useLoad } from "../../lib/api";
import { Badge } from "../../ui/Chip";
import { Button } from "../../ui/Button";
import { Notice, SelectField, TextField } from "../../ui/Form";
import { formatPrice } from "../../ui/format";
import { Card, ErrorNote, Loading, PageHeader, Toggle } from "../kit";

// Discount codes. The database applies them at checkout (percent or a flat amount, a minimum spend, a
// cap, dates, how many times in total and per customer) — nothing about a coupon is decided in the browser.
interface Coupon {
  id: string; code: string; description: string | null; discount_type: "percent" | "flat"; discount_value: number; max_discount: number | null;
  min_order: number; applies_to: "all" | "buy" | "rent"; starts_at: string | null; ends_at: string | null; usage_limit: number | null;
  per_user_limit: number; is_active: boolean;
}

async function loadCoupons(client: SupabaseClient) {
  const [coupons, redemptions] = await Promise.all([
    ok(client.from("coupons").select("*").order("created_at", { ascending: false })),
    ok(client.from("coupon_redemptions").select("coupon_id")),
  ]);
  const used = new Map<string, number>();
  for (const r of redemptions as { coupon_id: string }[]) used.set(r.coupon_id, (used.get(r.coupon_id) ?? 0) + 1);
  return { coupons: coupons as Coupon[], used };
}

const toLocal = (iso: string | null) => (iso ? new Date(new Date(iso).getTime() - new Date(iso).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "");
const fromLocal = (value: string) => (value ? new Date(value).toISOString() : null);
const describe = (c: Coupon) => `${c.discount_type === "percent" ? `${c.discount_value}% off${c.max_discount ? ` (up to ${formatPrice(c.max_discount)})` : ""}` : `${formatPrice(c.discount_value)} off`}${c.min_order ? ` · min ${formatPrice(c.min_order)}` : ""}`;

export function CouponsPage() {
  const { data, error, loading, reload } = useLoad(loadCoupons, undefined);
  if (loading) return <Loading />;
  if (error || !data) return <ErrorNote message={error ?? "Couldn’t load the coupons."} />;
  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Coupons" subtitle="Codes customers type in the cart." />
      <CouponForm key={data.coupons.length} onSaved={reload} />
      <h2 className="font-display text-lg font-bold text-text-primary">{data.coupons.length} {data.coupons.length === 1 ? "coupon" : "coupons"}</h2>
      {data.coupons.length === 0 && <p className="rounded-2xl border border-dashed border-border-subtle px-4 py-8 text-center text-sm text-text-muted">No coupons yet.</p>}
      <ul className="flex flex-col gap-3">
        {data.coupons.map((c) => <li key={c.id}><CouponForm coupon={c} used={data.used.get(c.id) ?? 0} onSaved={reload} /></li>)}
      </ul>
    </div>
  );
}

function CouponForm({ coupon, used = 0, onSaved }: { coupon?: Coupon; used?: number; onSaved: () => void }) {
  const { client } = useAuth();
  const { busy, message, run } = useAction();
  const [draft, setDraft] = useState({
    code: coupon?.code ?? "", description: coupon?.description ?? "", type: coupon?.discount_type ?? "percent", value: coupon ? String(coupon.discount_value) : "",
    max: coupon?.max_discount ? String(coupon.max_discount) : "", min: coupon ? String(coupon.min_order) : "0", applies: coupon?.applies_to ?? "all",
    starts: toLocal(coupon?.starts_at ?? null), ends: toLocal(coupon?.ends_at ?? null), limit: coupon?.usage_limit ? String(coupon.usage_limit) : "",
    perUser: coupon ? String(coupon.per_user_limit) : "1", active: coupon?.is_active ?? true,
  });
  const [problem, setProblem] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const set = <K extends keyof typeof draft>(key: K, value: (typeof draft)[K]) => setDraft((d) => ({ ...d, [key]: value }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = draft.code.trim().toUpperCase();
    const value = toInt(draft.value);
    const max = draft.max.trim() === "" ? null : toInt(draft.max);
    const min = toInt(draft.min);
    const limit = draft.limit.trim() === "" ? null : toInt(draft.limit);
    const perUser = toInt(draft.perUser);
    if (!/^[A-Z0-9_-]{3,32}$/.test(code)) return setProblem("The code must be 3–32 letters, numbers, - or _ (no spaces).");
    if (!value || value < 1 || (draft.type === "percent" && value > 100)) return setProblem(draft.type === "percent" ? "Enter a percentage from 1 to 100." : "Enter the discount in whole rupees.");
    if (draft.max.trim() !== "" && (!max || max < 1)) return setProblem("Enter the maximum discount in whole rupees, or leave it empty.");
    if (min === null) return setProblem("Enter the minimum spend in whole rupees (0 for none).");
    if (draft.limit.trim() !== "" && (!limit || limit < 1)) return setProblem("Enter how many times it can be used in total, or leave it empty.");
    if (!perUser || perUser < 1) return setProblem("Enter how many times one customer can use it (at least 1).");
    if (draft.starts && draft.ends && new Date(draft.ends) <= new Date(draft.starts)) return setProblem("The end must be after the start.");
    setProblem("");
    const row = {
      code, description: draft.description.trim() || null, discount_type: draft.type, discount_value: value, max_discount: draft.type === "percent" ? max : null,
      min_order: min, applies_to: draft.applies, starts_at: fromLocal(draft.starts), ends_at: fromLocal(draft.ends), usage_limit: limit, per_user_limit: perUser, is_active: draft.active,
    };
    const saved = await run(async () => {
      const supabase = await client();
      if (coupon) await ok(supabase.from("coupons").update(row).eq("id", coupon.id));
      else await ok(supabase.from("coupons").insert(row));
    }, coupon ? "Saved." : "Coupon added.");
    if (saved) onSaved();
  };

  const remove = async () => {
    if (await run(async () => ok((await client()).from("coupons").delete().eq("id", coupon!.id)), "Removed.")) onSaved();
    else setConfirmDelete(false);
  };

  return (
    <Card>
      <form onSubmit={save} className="flex flex-col gap-4" noValidate aria-label={coupon ? `Coupon ${coupon.code}` : "Add a coupon"}>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="font-display text-base font-bold text-text-primary">{coupon ? coupon.code : "Add a coupon"}</h3>
          {coupon && <span className="flex flex-wrap items-center gap-2 text-xs text-text-muted">{describe(coupon)} · used {used}× {!coupon.is_active && <Badge tone="warn">Off</Badge>}</span>}
        </div>
        {(problem || message) && <Notice tone={problem ? "error" : message!.tone}>{problem || message!.text}</Notice>}
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Code" autoCapitalize="characters" autoComplete="off" value={draft.code} onChange={(e) => set("code", e.target.value.toUpperCase())} disabled={Boolean(coupon)} hint={coupon ? "A code can’t be renamed — add a new one." : "e.g. WELCOME10"} />
          <TextField label="Description" hint="Optional, shown when it’s applied." value={draft.description} onChange={(e) => set("description", e.target.value)} />
          <SelectField label="Discount type" value={draft.type} onChange={(e) => set("type", e.target.value === "flat" ? "flat" : "percent")}>
            <option value="percent">Percent off</option>
            <option value="flat">Flat amount off</option>
          </SelectField>
          <TextField label={draft.type === "percent" ? "Percent (1–100)" : "Amount off (₹)"} inputMode="numeric" value={draft.value} onChange={(e) => set("value", e.target.value)} />
          {draft.type === "percent" && <TextField label="Maximum discount (₹)" hint="Optional cap" inputMode="numeric" value={draft.max} onChange={(e) => set("max", e.target.value)} />}
          <TextField label="Minimum spend (₹)" inputMode="numeric" value={draft.min} onChange={(e) => set("min", e.target.value)} />
          <SelectField label="Applies to" value={draft.applies} onChange={(e) => set("applies", e.target.value === "buy" ? "buy" : e.target.value === "rent" ? "rent" : "all")}>
            <option value="all">Buying and renting</option>
            <option value="buy">Buying only</option>
            <option value="rent">Renting only</option>
          </SelectField>
          <TextField label="Starts" type="datetime-local" hint="Optional" value={draft.starts} onChange={(e) => set("starts", e.target.value)} />
          <TextField label="Ends" type="datetime-local" hint="Optional" value={draft.ends} onChange={(e) => set("ends", e.target.value)} />
          <TextField label="Total uses allowed" hint="Optional — empty means unlimited" inputMode="numeric" value={draft.limit} onChange={(e) => set("limit", e.target.value)} />
          <TextField label="Uses per customer" inputMode="numeric" value={draft.perUser} onChange={(e) => set("perUser", e.target.value)} />
        </div>
        <Toggle label="Active" hint="Turn off to stop it working without deleting it." checked={draft.active} onChange={(v) => set("active", v)} />
        <div className="flex flex-wrap items-center gap-2">
          <Button type="submit" disabled={busy}>{busy ? "Saving…" : coupon ? "Save" : "Add coupon"}</Button>
          {coupon && !confirmDelete && <Button variant="ghost" onClick={() => setConfirmDelete(true)}>Delete…</Button>}
          {coupon && confirmDelete && (
            <>
              <Button variant="secondary" onClick={() => void remove()} disabled={busy}>Yes, delete it</Button>
              <Button variant="ghost" onClick={() => setConfirmDelete(false)}>Cancel</Button>
            </>
          )}
        </div>
      </form>
    </Card>
  );
}

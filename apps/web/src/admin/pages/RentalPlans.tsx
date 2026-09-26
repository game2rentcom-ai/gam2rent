import { useState } from "react";
import { useAuth } from "../../auth/context";
import { formatPrice } from "../../ui/format";
import { Button } from "../../ui/Button";
import { Notice, TextField } from "../../ui/Form";
import { ok, toInt, useAction, useLoad } from "../../lib/api";
import { Card, ErrorNote, Loading, Toggle } from "../kit";
import { loadPlans, type Plan } from "../plans";

// Store-wide rental plans (1 day, 3 days, …). A plan's price applies to every rentable game unless a
// game has its own price for it (see "Rental price by game").

export function RentalPlans() {
  const { data, error, loading, reload } = useLoad(loadPlans, undefined);
  if (loading) return <Loading />;
  if (error || !data) return <ErrorNote message={error ?? "Couldn’t load the plans."} />;
  return (
    <div className="flex flex-col gap-4">
      <PlanForm key={data.length} nextOrder={data.length + 1} onSaved={reload} />
      <h2 className="font-display text-lg font-bold text-text-primary">{data.length} {data.length === 1 ? "plan" : "plans"}</h2>
      {data.length === 0 && <p className="rounded-2xl border border-dashed border-border-subtle px-4 py-8 text-center text-sm text-text-muted">No rental plans yet. Until you add one, games show “Price on request” for renting.</p>}
      <ul className="flex flex-col gap-3">
        {data.map((p) => <li key={p.id}><PlanForm plan={p} onSaved={reload} /></li>)}
      </ul>
    </div>
  );
}

function PlanForm({ plan, nextOrder = 1, onSaved }: { plan?: Plan; nextOrder?: number; onSaved: () => void }) {
  const { client } = useAuth();
  const { busy, message, run } = useAction();
  const [draft, setDraft] = useState({
    label: plan?.label ?? "", days: plan ? String(plan.days) : "", price: plan ? String(plan.price) : "", tag: plan?.tag ?? "",
    popular: plan?.is_popular ?? false, active: plan?.is_active ?? true, order: String(plan?.sort_order ?? nextOrder),
  });
  const [problem, setProblem] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const set = <K extends keyof typeof draft>(key: K, value: (typeof draft)[K]) => setDraft((d) => ({ ...d, [key]: value }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const days = toInt(draft.days);
    const price = toInt(draft.price);
    const order = toInt(draft.order) ?? 0;
    if (!draft.label.trim()) return setProblem("Give the plan a name, e.g. “3 days”.");
    if (!days || days < 1) return setProblem("Enter how many days the plan lasts.");
    if (price === null) return setProblem("Enter the price in whole rupees.");
    setProblem("");
    const row = { label: draft.label.trim(), days, price, tag: draft.tag.trim() || null, is_popular: draft.popular, is_active: draft.active, sort_order: order };
    const saved = await run(async () => {
      const supabase = await client();
      if (plan) await ok(supabase.from("rental_plans").update(row).eq("id", plan.id));
      else await ok(supabase.from("rental_plans").insert(row));
    }, plan ? "Saved." : "Plan added.");
    if (saved) onSaved();
  };

  const remove = async () => {
    if (plan && (await run(async () => ok((await client()).from("rental_plans").delete().eq("id", plan.id)), "Removed."))) onSaved();
    else setConfirmDelete(false);
  };

  return (
    <Card>
      <form onSubmit={save} className="flex flex-col gap-4" noValidate aria-label={plan ? `Plan ${plan.label}` : "Add a plan"}>
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="font-display text-base font-bold text-text-primary">{plan ? plan.label : "Add a rental plan"}</h3>
          {plan && <span className="text-sm text-text-muted">{formatPrice(plan.price)}</span>}
        </div>
        {(problem || message) && <Notice tone={problem ? "error" : message!.tone}>{problem || message!.text}</Notice>}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <TextField label="Name" value={draft.label} onChange={(e) => set("label", e.target.value)} placeholder="3 days" />
          <TextField label="Days" inputMode="numeric" value={draft.days} onChange={(e) => set("days", e.target.value)} />
          <TextField label="Price (₹)" inputMode="numeric" value={draft.price} onChange={(e) => set("price", e.target.value)} />
          <TextField label="Tag" hint="Optional, e.g. Weekend" value={draft.tag} onChange={(e) => set("tag", e.target.value)} />
        </div>
        <div className="grid gap-1 sm:grid-cols-2 sm:gap-6">
          <Toggle label="Mark as popular" checked={draft.popular} onChange={(v) => set("popular", v)} />
          <Toggle label="Offered on the store" checked={draft.active} onChange={(v) => set("active", v)} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="submit" disabled={busy}>{busy ? "Saving…" : plan ? "Save" : "Add plan"}</Button>
          {plan && !confirmDelete && <Button variant="ghost" onClick={() => setConfirmDelete(true)}>Remove plan</Button>}
          {plan && confirmDelete && (
            <>
              <Button variant="secondary" onClick={() => void remove()} disabled={busy}>Yes, remove it</Button>
              <Button variant="ghost" onClick={() => setConfirmDelete(false)}>Cancel</Button>
            </>
          )}
        </div>
      </form>
    </Card>
  );
}

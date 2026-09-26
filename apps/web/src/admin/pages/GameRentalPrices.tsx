import type { SupabaseClient } from "@supabase/supabase-js";
import { useState } from "react";
import { useAuth } from "../../auth/context";
import { formatPrice } from "../../ui/format";
import { Button } from "../../ui/Button";
import { Notice, SelectField, TextField } from "../../ui/Form";
import { ok, toInt, useAction, useLoad } from "../../lib/api";
import { Card, ErrorNote, Loading } from "../kit";
import { loadPlans, type Plan } from "../plans";

// A game can have its own price for a plan (say, a big new release costs more than an old one).
// Leave a box empty to use the plan's normal price.
interface Override { plan_id: string; price: number }

async function loadContext(client: SupabaseClient) {
  const [plans, games] = await Promise.all([loadPlans(client), ok(client.from("games").select("id,title").order("title"))]);
  return { plans, games: games as { id: string; title: string }[] };
}
async function loadOverrides(client: SupabaseClient, gameId: string) {
  return gameId ? ((await ok(client.from("game_rental_prices").select("plan_id,price").eq("game_id", gameId))) as Override[]) : [];
}

export function GameRentalPrices() {
  const context = useLoad(loadContext, undefined);
  const [gameId, setGameId] = useState("");
  const [filter, setFilter] = useState("");
  const overrides = useLoad(loadOverrides, gameId);

  if (context.loading) return <Loading />;
  if (context.error || !context.data) return <ErrorNote message={context.error ?? "Couldn’t load."} />;
  const { plans, games } = context.data;
  const options = games.filter((g) => g.title.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col gap-4">
        <TextField label="Find a game" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Start typing a title" />
        <SelectField label="Game" value={gameId} onChange={(e) => setGameId(e.target.value)}>
          <option value="">Choose a game…</option>
          {options.map((g) => <option key={g.id} value={g.id}>{g.title}</option>)}
        </SelectField>
      </Card>
      {gameId && (plans.length === 0
        ? <p className="rounded-2xl border border-dashed border-border-subtle px-4 py-8 text-center text-sm text-text-muted">Add rental plans first (the “Rental plans” tab), then you can set game-specific prices here.</p>
        : overrides.loading ? <Loading /> : overrides.error || !overrides.data ? <ErrorNote message={overrides.error ?? "Couldn’t load."} />
        : <OverridesForm key={gameId} gameId={gameId} plans={plans} existing={overrides.data} onSaved={overrides.reload} />)}
    </div>
  );
}

function OverridesForm({ gameId, plans, existing, onSaved }: { gameId: string; plans: Plan[]; existing: Override[]; onSaved: () => void }) {
  const { client } = useAuth();
  const { busy, message, run } = useAction();
  const [values, setValues] = useState<Record<string, string>>(() => Object.fromEntries(existing.map((o) => [o.plan_id, String(o.price)])));
  const [problem, setProblem] = useState("");

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const keep: { game_id: string; plan_id: string; price: number }[] = [];
    const clear: string[] = [];
    for (const p of plans) {
      const raw = (values[p.id] ?? "").trim();
      if (raw === "") clear.push(p.id);
      else {
        const price = toInt(raw);
        if (price === null) return setProblem(`Enter whole rupees for “${p.label}”, or leave it empty.`);
        keep.push({ game_id: gameId, plan_id: p.id, price });
      }
    }
    setProblem("");
    const saved = await run(async () => {
      const supabase = await client();
      if (keep.length) await ok(supabase.from("game_rental_prices").upsert(keep, { onConflict: "game_id,plan_id" }));
      if (clear.length) await ok(supabase.from("game_rental_prices").delete().eq("game_id", gameId).in("plan_id", clear));
    }, "Saved.");
    if (saved) onSaved();
  };

  return (
    <Card>
      <form onSubmit={save} className="flex flex-col gap-4" noValidate>
        {(problem || message) && <Notice tone={problem ? "error" : message!.tone}>{problem || message!.text}</Notice>}
        <div className="grid gap-3 sm:grid-cols-2">
          {plans.map((p) => (
            <TextField
              key={p.id}
              label={`${p.label} (₹)`}
              hint={`Normal price ${formatPrice(p.price)}`}
              inputMode="numeric"
              placeholder={String(p.price)}
              value={values[p.id] ?? ""}
              onChange={(e) => setValues((v) => ({ ...v, [p.id]: e.target.value }))}
            />
          ))}
        </div>
        <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save prices for this game"}</Button>
      </form>
    </Card>
  );
}

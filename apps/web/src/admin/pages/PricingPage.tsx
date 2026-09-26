import type { SupabaseClient } from "@supabase/supabase-js";
import { useState } from "react";
import { useAuth } from "../../auth/context";
import { PLATFORM_LABEL, type Platform } from "../../data/catalogTypes";
import { Button } from "../../ui/Button";
import { Chip } from "../../ui/Chip";
import { Notice, SelectField, TextField } from "../../ui/Form";
import { ok, toInt, useAction, useLoad } from "../../lib/api";
import { Card, ErrorNote, Loading, PageHeader, Toggle } from "../kit";
import { GameRentalPrices } from "./GameRentalPrices";
import { RentalPlans } from "./RentalPlans";

// Prices live here, in the database — never in the code. Buy prices are per game; rental plans are
// store-wide with an optional price override per game.
interface Listing { game_id: string; platform: string; price: number; compare_at_price: number | null; delivery_eta_minutes: number; credential_type: string; is_available: boolean; is_featured: boolean }
interface GameOption { id: string; title: string; platforms: string[] }

async function loadBuyPrices(client: SupabaseClient) {
  const [listings, games] = await Promise.all([
    ok(client.from("listings").select("*")),
    ok(client.from("games").select("id,title,platforms").order("title")),
  ]);
  return { listings: listings as Listing[], games: games as GameOption[] };
}

type Tab = "buy" | "plans" | "byGame";

export function PricingPage() {
  const [tab, setTab] = useState<Tab>("buy");
  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Pricing" subtitle="What you charge to buy or rent. Changes appear on the store straight away." />
      <div role="tablist" aria-label="Pricing" className="no-scrollbar -mx-4 -my-2 flex gap-2 overflow-x-auto px-4 py-2 sm:mx-0 sm:px-0">
        {([["buy", "Buy prices"], ["plans", "Rental plans"], ["byGame", "Rental price by game"]] as [Tab, string][]).map(([value, label]) => (
          <span key={value} role="tab" aria-selected={tab === value}><Chip selected={tab === value} onClick={() => setTab(value)}>{label}</Chip></span>
        ))}
      </div>
      {tab === "buy" && <BuyPrices />}
      {tab === "plans" && <RentalPlans />}
      {tab === "byGame" && <GameRentalPrices />}
    </div>
  );
}

function BuyPrices() {
  const { data, error, loading, reload } = useLoad(loadBuyPrices, undefined);
  if (loading) return <Loading />;
  if (error || !data) return <ErrorNote message={error ?? "Couldn’t load prices."} />;
  const titles = new Map(data.games.map((g) => [g.id, g.title]));
  const priced = new Set(data.listings.map((l) => l.game_id));
  const sorted = [...data.listings].sort((a, b) => (titles.get(a.game_id) ?? "").localeCompare(titles.get(b.game_id) ?? ""));
  return (
    <div className="flex flex-col gap-4">
      <AddListing games={data.games.filter((g) => !priced.has(g.id))} onAdded={reload} />
      <h2 className="font-display text-lg font-bold text-text-primary">{sorted.length} {sorted.length === 1 ? "game" : "games"} with a price</h2>
      {sorted.length === 0 && <p className="rounded-2xl border border-dashed border-border-subtle px-4 py-8 text-center text-sm text-text-muted">No prices yet. Add your first one above — the game will show its price and a Buy button on the store.</p>}
      <ul className="flex flex-col gap-3">
        {sorted.map((l) => <li key={l.game_id}><ListingRow listing={l} title={titles.get(l.game_id) ?? l.game_id} onChanged={reload} /></li>)}
      </ul>
    </div>
  );
}

function AddListing({ games, onAdded }: { games: GameOption[]; onAdded: () => void }) {
  const { client } = useAuth();
  const { busy, message, run } = useAction();
  const [filter, setFilter] = useState("");
  const [gameId, setGameId] = useState("");
  const [price, setPrice] = useState("");
  const [eta, setEta] = useState("60");
  const [credential, setCredential] = useState("id_password");
  const [platform, setPlatform] = useState("");
  const options = games.filter((g) => g.title.toLowerCase().includes(filter.toLowerCase()));
  const game = games.find((g) => g.id === gameId);
  const [problem, setProblem] = useState("");

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = toInt(price);
    const minutes = toInt(eta);
    if (!game) return setProblem("Choose a game.");
    if (amount === null) return setProblem("Enter the price in whole rupees.");
    if (!minutes || minutes < 1) return setProblem("Enter the delivery time in minutes.");
    setProblem("");
    const added = await run(async () => {
      await ok((await client()).from("listings").insert({ game_id: game.id, platform: platform || game.platforms[0], price: amount, delivery_eta_minutes: minutes, credential_type: credential }));
    }, `${game.title} now has a price.`);
    if (added) {
      setGameId(""); setPrice(""); setPlatform("");
      onAdded();
    }
  };

  return (
    <Card>
      <form onSubmit={add} className="flex flex-col gap-4" noValidate>
        <h2 className="font-display text-lg font-bold text-text-primary">Add a game price</h2>
        {(problem || message) && <Notice tone={problem ? "error" : message!.tone}>{problem || message!.text}</Notice>}
        <TextField label="Find a game" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Start typing a title" />
        <SelectField label="Game" value={gameId} onChange={(e) => { setGameId(e.target.value); setPlatform(""); }}>
          <option value="">Choose a game…</option>
          {options.map((g) => <option key={g.id} value={g.id}>{g.title}</option>)}
        </SelectField>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Price (₹)" type="text" inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value)} />
          <TextField label="Delivery time (minutes)" type="text" inputMode="numeric" value={eta} onChange={(e) => setEta(e.target.value)} />
          <SelectField label="Platform being sold" value={platform || game?.platforms[0] || ""} onChange={(e) => setPlatform(e.target.value)} disabled={!game}>
            {(game?.platforms ?? []).map((p) => <option key={p} value={p}>{PLATFORM_LABEL[p as Platform] ?? p}</option>)}
          </SelectField>
          <SelectField label="Customer receives" value={credential} onChange={(e) => setCredential(e.target.value)}>
            <option value="id_password">Login (ID and password)</option>
            <option value="qr_code">A scan-to-play code</option>
          </SelectField>
        </div>
        <Button type="submit" size="lg" disabled={busy}>{busy ? "Adding…" : "Add price"}</Button>
      </form>
    </Card>
  );
}

function ListingRow({ listing, title, onChanged }: { listing: Listing; title: string; onChanged: () => void }) {
  const { client } = useAuth();
  const { busy, message, run } = useAction();
  const [draft, setDraft] = useState({
    price: String(listing.price), compare: listing.compare_at_price === null ? "" : String(listing.compare_at_price),
    eta: String(listing.delivery_eta_minutes), credential: listing.credential_type, available: listing.is_available, featured: listing.is_featured,
  });
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [problem, setProblem] = useState("");
  const set = <K extends keyof typeof draft>(key: K, value: (typeof draft)[K]) => setDraft((d) => ({ ...d, [key]: value }));

  const save = async () => {
    const price = toInt(draft.price);
    const compare = draft.compare.trim() === "" ? null : toInt(draft.compare);
    const eta = toInt(draft.eta);
    if (price === null) return setProblem("Enter the price in whole rupees.");
    if (compare !== null && compare < price) return setProblem("The “was” price can’t be lower than the price.");
    if (draft.compare.trim() !== "" && compare === null) return setProblem("Enter the “was” price in whole rupees, or leave it empty.");
    if (!eta || eta < 1) return setProblem("Enter the delivery time in minutes.");
    setProblem("");
    if (await run(async () => ok((await client()).from("listings").update({ price, compare_at_price: compare, delivery_eta_minutes: eta, credential_type: draft.credential, is_available: draft.available, is_featured: draft.featured }).eq("game_id", listing.game_id)), "Saved.")) onChanged();
  };

  const remove = async () => {
    if (await run(async () => ok((await client()).from("listings").delete().eq("game_id", listing.game_id)), "Removed.")) onChanged();
    else setConfirmRemove(false);
  };

  return (
    <Card className="flex flex-col gap-4" >
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="min-w-0 truncate font-display text-base font-bold text-text-primary">{title}</h3>
        <span className="shrink-0 text-xs text-text-muted">{PLATFORM_LABEL[listing.platform as Platform] ?? listing.platform}</span>
      </div>
      {(problem || message) && <Notice tone={problem ? "error" : message!.tone}>{problem || message!.text}</Notice>}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <TextField label="Price (₹)" inputMode="numeric" value={draft.price} onChange={(e) => set("price", e.target.value)} />
        <TextField label="Was (₹)" inputMode="numeric" hint="Optional" value={draft.compare} onChange={(e) => set("compare", e.target.value)} />
        <TextField label="Delivery (min)" inputMode="numeric" value={draft.eta} onChange={(e) => set("eta", e.target.value)} />
        <SelectField label="Customer gets" value={draft.credential} onChange={(e) => set("credential", e.target.value)}>
          <option value="id_password">Login</option>
          <option value="qr_code">QR code</option>
        </SelectField>
      </div>
      <div className="grid gap-1 sm:grid-cols-2 sm:gap-6">
        <Toggle label="Available to buy" checked={draft.available} onChange={(v) => set("available", v)} />
        <Toggle label="Feature on the home page" checked={draft.featured} onChange={(v) => set("featured", v)} />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={() => void save()} disabled={busy}>{busy ? "Saving…" : "Save"}</Button>
        {!confirmRemove ? <Button variant="ghost" onClick={() => setConfirmRemove(true)}>Remove price</Button> : (
          <>
            <Button variant="secondary" onClick={() => void remove()} disabled={busy}>Yes, remove it</Button>
            <Button variant="ghost" onClick={() => setConfirmRemove(false)}>Cancel</Button>
          </>
        )}
      </div>
    </Card>
  );
}

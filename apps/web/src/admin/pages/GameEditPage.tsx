import type { SupabaseClient } from "@supabase/supabase-js";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../auth/context";
import { PLATFORM_LABEL, type Platform } from "../../data/catalogTypes";
import { Button } from "../../ui/Button";
import { Notice, SelectField, TextAreaField, TextField } from "../../ui/Form";
import { IconBack } from "../../ui/icons";
import { ImageField } from "../ImageField";
import { ok, toInt, useAction, useLoad } from "../../lib/api";
import { Card, ErrorNote, Loading, PageHeader, Toggle } from "../kit";

interface Listing {
  id: string;
  game_id: string;
  platform: string;
  price: number;
  compare_at_price: number | null;
  delivery_eta_minutes: number;
  credential_type: string;
  is_available: boolean;
  is_featured: boolean;
}

interface PlatformConfig {
  enabled: boolean;
  buy: boolean;
  rent: boolean;
  listingId: string | null;
  price: string;
  compare: string;
  eta: string;
  credential: string;
  available: boolean;
  featured: boolean;
}

interface GameForm {
  id: string;
  title: string;
  category: "game" | "app";
  genre: string;
  franchise: string;
  developer: string;
  publisher: string;
  releaseInfo: string;
  description: string;
  coverUrl: string;
  heroUrl: string;
  isPublished: boolean;
  platformConfigs: Record<string, PlatformConfig>;
}

const PLATFORMS = Object.keys(PLATFORM_LABEL) as Platform[];

const defaultConfig = (): PlatformConfig => ({
  enabled: false, buy: false, rent: false,
  listingId: null, price: "", compare: "", eta: "60",
  credential: "id_password", available: true, featured: false,
});

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const slugify = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const EMPTY: GameForm = {
  id: "", title: "", category: "game", genre: "", franchise: "",
  developer: "", publisher: "", releaseInfo: "", description: "",
  coverUrl: "", heroUrl: "", isPublished: true,
  platformConfigs: Object.fromEntries(
    PLATFORMS.map((p) => [p, { ...defaultConfig(), rent: p === "pc" }])
  ),
};

function fromRow(game: Record<string, unknown>, listings: Listing[]): GameForm {
  const gamePlatforms = Array.isArray(game.platforms) ? (game.platforms as string[]) : [];
  const rentOn: string[] = game.is_rentable === false ? [] : Array.isArray(game.rental_platforms) ? (game.rental_platforms as string[]) : ["pc"];
  const byPlatform = new Map(listings.map((l) => [l.platform, l]));
  const platformConfigs: Record<string, PlatformConfig> = {};
  for (const p of PLATFORMS) {
    const l = byPlatform.get(p);
    platformConfigs[p] = {
      enabled: gamePlatforms.includes(p),
      buy: Boolean(l),
      rent: rentOn.includes(p),
      listingId: l?.id ?? null,
      price: l ? String(l.price) : "",
      compare: l?.compare_at_price != null ? String(l.compare_at_price) : "",
      eta: l ? String(l.delivery_eta_minutes) : "60",
      credential: l?.credential_type ?? "id_password",
      available: l?.is_available ?? true,
      featured: l?.is_featured ?? false,
    };
  }
  return {
    id: String(game.id), title: String(game.title ?? ""),
    category: game.category === "app" ? "app" : "game",
    genre: String(game.genre ?? ""), franchise: String(game.franchise ?? ""),
    developer: String(game.developer ?? ""), publisher: String(game.publisher ?? ""),
    releaseInfo: String(game.release_info ?? ""), description: String(game.description ?? ""),
    coverUrl: String(game.cover_url ?? ""), heroUrl: String(game.hero_url ?? ""),
    isPublished: game.is_published !== false,
    platformConfigs,
  };
}

function toGameRow(f: GameForm) {
  const platforms = PLATFORMS.filter((p) => f.platformConfigs[p]?.enabled);
  const rentOn = PLATFORMS.filter((p) => f.platformConfigs[p]?.enabled && f.platformConfigs[p]?.rent);
  return {
    title: f.title.trim(), category: f.category, genre: f.genre.trim(),
    platforms,
    franchise: f.franchise.trim() || null, developer: f.developer.trim() || null,
    publisher: f.publisher.trim() || null, release_info: f.releaseInfo.trim() || null,
    description: f.description.trim() || null, cover_url: f.coverUrl || null,
    hero_url: f.heroUrl || null, is_published: f.isPublished,
    is_rentable: rentOn.length > 0,
    rental_platforms: rentOn.length > 0 ? rentOn : null,
  };
}

async function loadGame(client: SupabaseClient, id: string | null) {
  if (!id) return null;
  const [game, listings] = await Promise.all([
    ok(client.from("games").select("*").eq("id", id).maybeSingle()),
    ok(client.from("listings").select("*").eq("game_id", id)),
  ]);
  return { game: game as Record<string, unknown> | null, listings: (listings ?? []) as Listing[] };
}

export function GameEditPage() {
  const { id } = useParams();
  const { data, error, loading } = useLoad(loadGame, id ?? null);
  if (id && loading) return <Loading />;
  if (id && error) return <ErrorNote message={error} />;
  if (id && (!data?.game)) return <ErrorNote message="That game doesn't exist." />;
  return <Editor key={id ?? "new"} initial={data ? fromRow(data.game!, data.listings) : EMPTY} existing={Boolean(id)} />;
}

function Editor({ initial, existing }: { initial: GameForm; existing: boolean }) {
  const { client } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { busy, message, run } = useAction();
  const set = <K extends keyof GameForm>(key: K, value: GameForm[K]) => setForm((f) => ({ ...f, [key]: value }));
  const text = (key: "title" | "genre" | "franchise" | "developer" | "publisher" | "releaseInfo") =>
    (e: React.ChangeEvent<HTMLInputElement>) => set(key, e.target.value);
  const setPlatform = (p: Platform, cfg: Partial<PlatformConfig>) =>
    setForm((f) => ({ ...f, platformConfigs: { ...f.platformConfigs, [p]: { ...f.platformConfigs[p], ...cfg } } }));
  const gameId = existing ? form.id : form.id || slugify(form.title);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const found: Record<string, string> = {};
    if (!form.title.trim()) found.title = "Enter the game's title.";
    if (!SLUG.test(gameId)) found.id = "Use lowercase letters, numbers and hyphens only (e.g. hades-2).";
    const enabled = PLATFORMS.filter((p) => form.platformConfigs[p]?.enabled);
    if (enabled.length === 0) found.platforms = "Enable at least one platform.";
    // Same rules as Pricing → Buy prices and the database, so a save never fails halfway on a raw database error.
    for (const p of enabled) {
      const cfg = form.platformConfigs[p];
      if (!cfg?.buy) continue;
      const price = toInt(cfg.price);
      const compare = cfg.compare.trim() === "" ? null : toInt(cfg.compare);
      const eta = toInt(cfg.eta);
      if (price === null) found[`price_${p}`] = `Enter the ${PLATFORM_LABEL[p]} price in whole rupees.`;
      if (cfg.compare.trim() !== "" && compare === null) found[`compare_${p}`] = "Whole rupees, or leave it empty.";
      else if (compare !== null && price !== null && compare < price) found[`compare_${p}`] = "Can't be lower than the price.";
      if (eta === null || eta < 1) found[`eta_${p}`] = "Enter the delivery time in minutes.";
    }
    if ([form.coverUrl, form.heroUrl].some((u) => u && !u.startsWith("https://"))) found.images = "Picture addresses must start with https://";
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const saved = await run(async () => {
      const supabase = await client();
      if (existing) await ok(supabase.from("games").update(toGameRow(form)).eq("id", form.id));
      else await ok(supabase.from("games").insert({ id: gameId, ...toGameRow(form) }));

      for (const p of PLATFORMS) {
        const cfg = form.platformConfigs[p];
        if (!cfg) continue;
        if (cfg.enabled && cfg.buy) {
          const row = {
            game_id: gameId, platform: p,
            price: toInt(cfg.price) ?? 0,
            compare_at_price: cfg.compare.trim() ? (toInt(cfg.compare) ?? null) : null,
            delivery_eta_minutes: toInt(cfg.eta) ?? 60,
            credential_type: cfg.credential,
            is_available: cfg.available,
            is_featured: cfg.featured,
          };
          if (cfg.listingId) {
            await ok(supabase.from("listings").update(row).eq("id", cfg.listingId));
          } else {
            await ok(supabase.from("listings").insert(row));
          }
        } else if (cfg.listingId) {
          await ok(supabase.from("listings").delete().eq("id", cfg.listingId));
        }
      }
    }, existing ? "Saved." : "Game added.");

    if (saved && !existing) navigate(`/admin/games/${gameId}`, { replace: true });
  };

  const remove = async () => {
    const removed = await run(async () => ok((await client()).from("games").delete().eq("id", form.id)), "Deleted.");
    if (removed) navigate("/admin/games", { replace: true });
    else setConfirmDelete(false);
  };

  return (
    <form onSubmit={save} className="flex flex-col gap-5" noValidate>
      <Link to="/admin/games" className="-ml-2 inline-flex min-h-11 items-center gap-1 self-start rounded-lg px-2 text-sm font-semibold text-text-muted hover:text-text-primary">
        <IconBack className="h-5 w-5" />All games
      </Link>
      <PageHeader title={existing ? form.title || "Edit game" : "Add a game"} subtitle={existing ? undefined : "It appears on the store as soon as you save."} />
      {message && <Notice tone={message.tone}>{message.text}</Notice>}

      <Card className="flex flex-col gap-4">
        <TextField label="Title" value={form.title} onChange={text("title")} error={errors.title} />
        {!existing && (
          <TextField label="Web address name" hint={`The game's page will be /games/${gameId || "…"}`} value={form.id} placeholder={slugify(form.title)} onChange={(e) => set("id", e.target.value.toLowerCase())} error={errors.id} />
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Genre" value={form.genre} onChange={text("genre")} />
          <TextField label="Series / franchise" value={form.franchise} onChange={text("franchise")} />
          <TextField label="Developer" value={form.developer} onChange={text("developer")} />
          <TextField label="Publisher" value={form.publisher} onChange={text("publisher")} />
          <TextField label="Release" hint="A year or a range, e.g. 2023" value={form.releaseInfo} onChange={text("releaseInfo")} />
          <SelectField label="Type" value={form.category} onChange={(e) => set("category", e.target.value === "app" ? "app" : "game")}>
            <option value="game">Game</option>
            <option value="app">App / software</option>
          </SelectField>
        </div>
        <TextAreaField label="Description" hint="What the game is, in a couple of sentences." value={form.description} onChange={(e) => set("description", e.target.value)} />
      </Card>

      <Card className="flex flex-col gap-5">
        <h2 className="font-display text-lg font-bold text-text-primary">Pictures</h2>
        <ImageField label="Cover (tall)" kind="cover" folder={gameId} value={form.coverUrl} onChange={(v) => set("coverUrl", v)} hint="Portrait image — ideal size 600×900 px (2:3 ratio). JPG/PNG/WebP, max 5 MB. For Steam games paste: https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/APP_ID/library_600x900.jpg" />
        <ImageField label="Banner (wide)" kind="banner" folder={gameId} value={form.heroUrl} onChange={(v) => set("heroUrl", v)} hint="Wide banner — ideal size 1920×620 px (3:1 ratio). JPG/PNG/WebP, max 5 MB. For Steam games paste: https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/APP_ID/library_hero.jpg" />
        {errors.images && <p role="alert" className="text-xs font-medium text-red-300">{errors.images}</p>}
        <p className="text-xs text-text-muted">Without your own pictures the store shows matching artwork where we have it, otherwise a generated placeholder.</p>
      </Card>

      <Card className="flex flex-col gap-2">
        <Toggle label="Shown on the store" hint="Turn off to hide the game without deleting it." checked={form.isPublished} onChange={(v) => set("isPublished", v)} />
      </Card>

      <div className="flex flex-col gap-3">
        <div>
          <h2 className="font-display text-lg font-bold text-text-primary">Platforms &amp; Pricing</h2>
          <p className="mt-0.5 text-xs text-text-muted">Enable each platform this game is available on, then choose how it's sold.</p>
          {errors.platforms && <p role="alert" className="mt-1 text-xs font-medium text-red-300">{errors.platforms}</p>}
        </div>
        {PLATFORMS.map((p) => (
          <PlatformCard
            key={p}
            platform={p}
            config={form.platformConfigs[p] ?? defaultConfig()}
            errors={{ price: errors[`price_${p}`], compare: errors[`compare_${p}`], eta: errors[`eta_${p}`] }}
            onChange={(cfg) => setPlatform(p, cfg)}
          />
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" size="lg" disabled={busy}>{busy ? "Saving…" : existing ? "Save changes" : "Add game"}</Button>
        {existing && <Button to={`/games/${form.id}`} variant="secondary" size="lg">View on the store</Button>}
        {existing && !confirmDelete && <Button variant="ghost" size="lg" onClick={() => setConfirmDelete(true)}>Delete…</Button>}
        {existing && confirmDelete && (
          <span className="flex items-center gap-2">
            <Button variant="secondary" size="lg" onClick={() => void remove()} disabled={busy}>Yes, delete it</Button>
            <Button variant="ghost" size="lg" onClick={() => setConfirmDelete(false)}>Cancel</Button>
          </span>
        )}
      </div>
    </form>
  );
}

function PlatformCard({ platform, config, errors, onChange }: {
  platform: Platform;
  config: PlatformConfig;
  errors: { price?: string; compare?: string; eta?: string };
  onChange: (cfg: Partial<PlatformConfig>) => void;
}) {
  const set = <K extends keyof PlatformConfig>(k: K, v: PlatformConfig[K]) => onChange({ [k]: v });

  return (
    <Card className="flex flex-col gap-4">
      <Toggle
        label={PLATFORM_LABEL[platform]}
        hint={config.enabled ? "Visible on the store" : "Hidden from customers"}
        checked={config.enabled}
        onChange={(v) => onChange({ enabled: v })}
      />

      {config.enabled && (
        <div className="flex flex-col gap-4 border-t border-border-subtle pt-4">
          <div className="grid gap-2 sm:grid-cols-2">
            <Toggle
              label="Permanent sale"
              hint="Customers can buy this platform version outright"
              checked={config.buy}
              onChange={(v) => set("buy", v)}
            />
            <Toggle
              label="Rental"
              hint="Offers your rental plans on this platform"
              checked={config.rent}
              onChange={(v) => set("rent", v)}
            />
          </div>

          {config.buy && (
            <div className="flex flex-col gap-3 rounded-xl border border-border-subtle bg-bg-raised/40 p-3">
              <p className="text-[0.65rem] font-bold uppercase tracking-widest text-text-muted">Sale settings</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <TextField label="Price (₹)" inputMode="numeric" value={config.price} onChange={(e) => set("price", e.target.value)} error={errors.price} />
                <TextField label="Was (₹)" inputMode="numeric" hint="Optional" value={config.compare} onChange={(e) => set("compare", e.target.value)} error={errors.compare} />
                <TextField label="Delivery (min)" inputMode="numeric" value={config.eta} onChange={(e) => set("eta", e.target.value)} error={errors.eta} />
                <SelectField label="Customer gets" value={config.credential} onChange={(e) => set("credential", e.target.value)}>
                  <option value="id_password">Login (ID + password)</option>
                  <option value="qr_code">QR code</option>
                </SelectField>
              </div>
              <div className="grid gap-1 sm:grid-cols-2 sm:gap-4">
                <Toggle label="Available to buy" checked={config.available} onChange={(v) => set("available", v)} />
                <Toggle label="Feature on homepage" checked={config.featured} onChange={(v) => set("featured", v)} />
              </div>
            </div>
          )}

          {config.rent && (
            <p className="text-xs text-text-muted">
              Rental uses your store-wide plans, the same on every platform. Edit the plans, or give this game its own rental price, under{" "}
              <Link to="/admin/pricing" className="font-semibold text-text-primary underline underline-offset-2">Pricing</Link>.
            </p>
          )}

          {!config.buy && !config.rent && (
            <p className="text-xs font-medium text-yellow-400">
              Customers see {PLATFORM_LABEL[platform]} with &ldquo;Ask us&rdquo; and can message you about it. Turn on Permanent sale or Rental to show a price.
            </p>
          )}
        </div>
      )}
    </Card>
  );
}

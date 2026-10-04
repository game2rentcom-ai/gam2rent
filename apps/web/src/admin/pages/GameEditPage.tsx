import type { SupabaseClient } from "@supabase/supabase-js";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../auth/context";
import { PLATFORM_LABEL, type Platform } from "../../data/catalogTypes";
import { Button } from "../../ui/Button";
import { CheckboxField, Notice, SelectField, TextAreaField, TextField } from "../../ui/Form";
import { IconBack } from "../../ui/icons";
import { ImageField } from "../ImageField";
import { ok, useAction, useLoad } from "../../lib/api";
import { Card, ErrorNote, Loading, PageHeader, Toggle } from "../kit";

interface GameForm {
  id: string; title: string; category: "game" | "app"; genre: string; franchise: string; platforms: string[];
  developer: string; publisher: string; releaseInfo: string; description: string; coverUrl: string; heroUrl: string;
  isPublished: boolean;
  /** Platforms the game can be rented on; the others are sold permanently. Empty = not rentable. */
  rentOn: string[];
}

const EMPTY: GameForm = { id: "", title: "", category: "game", genre: "", franchise: "", platforms: [], developer: "", publisher: "", releaseInfo: "", description: "", coverUrl: "", heroUrl: "", isPublished: true, rentOn: ["pc"] };
const PLATFORMS = Object.keys(PLATFORM_LABEL) as Platform[];
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const slugify = (title: string) => title.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const fromRow = (r: Record<string, unknown>): GameForm => ({
  id: String(r.id), title: String(r.title ?? ""), category: r.category === "app" ? "app" : "game", genre: String(r.genre ?? ""),
  franchise: String(r.franchise ?? ""), platforms: Array.isArray(r.platforms) ? (r.platforms as string[]) : [], developer: String(r.developer ?? ""),
  publisher: String(r.publisher ?? ""), releaseInfo: String(r.release_info ?? ""), description: String(r.description ?? ""),
  coverUrl: String(r.cover_url ?? ""), heroUrl: String(r.hero_url ?? ""), isPublished: r.is_published !== false,
  rentOn: r.is_rentable === false ? [] : Array.isArray(r.rental_platforms) ? (r.rental_platforms as string[]) : ["pc"],
});

const toRow = (f: GameForm) => ({
  title: f.title.trim(), category: f.category, genre: f.genre.trim(), platforms: f.platforms, franchise: f.franchise.trim() || null,
  developer: f.developer.trim() || null, publisher: f.publisher.trim() || null, release_info: f.releaseInfo.trim() || null,
  description: f.description.trim() || null, cover_url: f.coverUrl || null, hero_url: f.heroUrl || null, is_published: f.isPublished,
  ...rentalColumns(f),
});

// Only platforms the game is on can be rented (the database checks this too).
const rentalColumns = (f: GameForm) => {
  const rentOn = f.rentOn.filter((p) => f.platforms.includes(p));
  return { is_rentable: rentOn.length > 0, rental_platforms: rentOn.length > 0 ? rentOn : null };
};

async function loadGame(client: SupabaseClient, id: string | null) {
  if (!id) return null;
  return ok(client.from("games").select("*").eq("id", id).maybeSingle());
}

export function GameEditPage() {
  const { id } = useParams();
  const { data, error, loading } = useLoad(loadGame, id ?? null);
  if (id && loading) return <Loading />;
  if (id && error) return <ErrorNote message={error} />;
  if (id && !data) return <ErrorNote message="That game doesn’t exist." />;
  return <Editor key={id ?? "new"} initial={data ? fromRow(data) : EMPTY} existing={Boolean(id)} />;
}

function Editor({ initial, existing }: { initial: GameForm; existing: boolean }) {
  const { client } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { busy, message, run } = useAction();
  const set = <K extends keyof GameForm>(key: K, value: GameForm[K]) => setForm((f) => ({ ...f, [key]: value }));
  const text = (key: "title" | "genre" | "franchise" | "developer" | "publisher" | "releaseInfo") => (e: React.ChangeEvent<HTMLInputElement>) => set(key, e.target.value);
  const id = existing ? form.id : form.id || slugify(form.title);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const found: Record<string, string> = {};
    if (!form.title.trim()) found.title = "Enter the game’s title.";
    if (!SLUG.test(id)) found.id = "Use lowercase letters, numbers and hyphens only (e.g. hades-2).";
    if (form.platforms.length === 0) found.platforms = "Choose at least one platform.";
    if ([form.coverUrl, form.heroUrl].some((u) => u && !u.startsWith("https://"))) found.images = "Picture addresses must start with https://";
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    const saved = await run(async () => {
      const supabase = await client();
      if (existing) await ok(supabase.from("games").update(toRow(form)).eq("id", form.id));
      else await ok(supabase.from("games").insert({ id, ...toRow(form) }));
    }, existing ? "Saved." : "Game added.");
    if (saved && !existing) navigate(`/admin/games/${id}`, { replace: true });
  };

  const remove = async () => {
    const removed = await run(async () => ok((await client()).from("games").delete().eq("id", form.id)), "Deleted.");
    if (removed) navigate("/admin/games", { replace: true });
    else setConfirmDelete(false);
  };

  return (
    <form onSubmit={save} className="flex flex-col gap-5" noValidate>
      <Link to="/admin/games" className="-ml-2 inline-flex min-h-11 items-center gap-1 self-start rounded-lg px-2 text-sm font-semibold text-text-muted hover:text-text-primary"><IconBack className="h-5 w-5" />All games</Link>
      <PageHeader title={existing ? form.title || "Edit game" : "Add a game"} subtitle={existing ? undefined : "It appears on the store as soon as you save."} />
      {message && <Notice tone={message.tone}>{message.text}</Notice>}

      <Card className="flex flex-col gap-4">
        <TextField label="Title" value={form.title} onChange={text("title")} error={errors.title} />
        {!existing && <TextField label="Web address name" hint={`The game’s page will be /games/${id || "…"}`} value={form.id} placeholder={slugify(form.title)} onChange={(e) => set("id", e.target.value.toLowerCase())} error={errors.id} />}
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
        <fieldset>
          <legend className="mb-1 text-sm font-semibold text-text-primary">Platforms</legend>
          <div className="grid grid-cols-2 gap-x-4 sm:grid-cols-3">
            {PLATFORMS.map((p) => (
              <CheckboxField key={p} label={PLATFORM_LABEL[p]} checked={form.platforms.includes(p)} onChange={(e) => set("platforms", e.target.checked ? [...form.platforms, p] : form.platforms.filter((x) => x !== p))} />
            ))}
          </div>
          {errors.platforms && <p role="alert" className="text-xs font-medium text-red-300">{errors.platforms}</p>}
        </fieldset>
        <TextAreaField label="Description" hint="What the game is, in a couple of sentences." value={form.description} onChange={(e) => set("description", e.target.value)} />
      </Card>

      <Card className="flex flex-col gap-5">
        <h2 className="font-display text-lg font-bold text-text-primary">Pictures</h2>
        <ImageField label="Cover (tall)" kind="cover" folder={id} value={form.coverUrl} onChange={(v) => set("coverUrl", v)} hint="Shown on cards. Portrait works best." />
        <ImageField label="Banner (wide)" kind="banner" folder={id} value={form.heroUrl} onChange={(v) => set("heroUrl", v)} hint="Shown at the top of the game’s page." />
        {errors.images && <p role="alert" className="text-xs font-medium text-red-300">{errors.images}</p>}
        <p className="text-xs text-text-muted">Without your own pictures the store shows matching artwork where we have it, otherwise a generated placeholder.</p>
      </Card>

      <Card className="flex flex-col gap-2">
        <Toggle label="Shown on the store" hint="Turn off to hide the game without deleting it." checked={form.isPublished} onChange={(v) => set("isPublished", v)} />
      </Card>

      <Card className="flex flex-col gap-2">
        <fieldset>
          <legend className="text-sm font-semibold text-text-primary">Rent or buy, per platform</legend>
          <p className="mb-2 text-xs text-text-muted">Ticked platforms show your rental plans (1 hour, 1 day, 7 days…). Unticked ones are sold permanently at the price you set in Pricing. Usual setup: PC online games rented, PS4 and PS5 sold.</p>
          {form.platforms.length === 0 ? <p className="text-xs text-text-muted">Choose the game’s platforms above first.</p> : (
            <div className="grid grid-cols-2 gap-x-4 sm:grid-cols-3">
              {form.platforms.map((p) => (
                <CheckboxField key={p} label={`Rent on ${PLATFORM_LABEL[p as Platform] ?? p}`} checked={form.rentOn.includes(p)} onChange={(e) => set("rentOn", e.target.checked ? [...form.rentOn, p] : form.rentOn.filter((x) => x !== p))} />
              ))}
            </div>
          )}
        </fieldset>
      </Card>

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

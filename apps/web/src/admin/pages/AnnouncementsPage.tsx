import type { SupabaseClient } from "@supabase/supabase-js";
import { useState } from "react";
import { useAuth } from "../../auth/context";
import { Button } from "../../ui/Button";
import { Notice, TextField } from "../../ui/Form";
import { ok, toInt, useAction, useLoad } from "../../lib/api";
import { ImageField } from "../ImageField";
import { Card, ErrorNote, Loading, PageHeader, Toggle } from "../kit";

// Home-page slides: new games ("GTA 6 is coming") and offers. The database shows a slide to visitors only
// while it is switched on and inside its dates, so a slide can be prepared ahead and ends by itself.

interface Slide {
  id: string; title: string; subtitle: string | null; image_url: string | null; button_label: string | null; button_href: string | null;
  starts_at: string | null; ends_at: string | null; countdown_to: string | null; is_active: boolean; sort_order: number;
}

const load = async (client: SupabaseClient) =>
  (await ok(client.from("announcements").select("*").order("sort_order").order("created_at"))) as Slide[];

// <input type="datetime-local"> works in the admin's own clock; the database stores an exact moment.
const toInput = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
};
const fromInput = (value: string) => (value ? new Date(value).toISOString() : null);

const status = (s: Slide, now: number) =>
  !s.is_active ? "Off"
    : s.starts_at && Date.parse(s.starts_at) > now ? "Scheduled"
      : s.ends_at && Date.parse(s.ends_at) <= now ? "Ended"
        : "Live";

export function AnnouncementsPage() {
  const { data, error, loading, reload } = useLoad(load, undefined);
  const [now] = useState(() => Date.now());
  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Announcements" subtitle="Slides at the top of the home page, above “Find your next game”. Use them for new games and offers." />
      {loading ? <Loading /> : error || !data ? <ErrorNote message={error ?? "Couldn’t load the slides."} onRetry={reload} /> : (
        <>
          <SlideForm key={data.length} nextOrder={data.length + 1} onSaved={reload} />
          <h2 className="font-display text-lg font-bold text-text-primary">{data.length} {data.length === 1 ? "slide" : "slides"}</h2>
          {data.length === 0 && <p className="rounded-2xl border border-dashed border-border-subtle px-4 py-8 text-center text-sm text-text-muted">No slides yet. Add one above, for example “GTA 6 is coming” with a countdown to its launch.</p>}
          <ul className="flex flex-col gap-3">
            {data.map((s) => <li key={s.id}><SlideForm slide={s} now={now} onSaved={reload} /></li>)}
          </ul>
        </>
      )}
    </div>
  );
}

function SlideForm({ slide, now = 0, nextOrder = 1, onSaved }: { slide?: Slide; now?: number; nextOrder?: number; onSaved: () => void }) {
  const { client } = useAuth();
  const { busy, message, run } = useAction();
  const [draft, setDraft] = useState({
    title: slide?.title ?? "", subtitle: slide?.subtitle ?? "", image: slide?.image_url ?? "",
    buttonLabel: slide?.button_label ?? "", buttonHref: slide?.button_href ?? "",
    starts: toInput(slide?.starts_at ?? null), ends: toInput(slide?.ends_at ?? null), countdown: toInput(slide?.countdown_to ?? null),
    active: slide?.is_active ?? true, order: String(slide?.sort_order ?? nextOrder),
  });
  const [problem, setProblem] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const set = <K extends keyof typeof draft>(key: K, value: (typeof draft)[K]) => setDraft((d) => ({ ...d, [key]: value }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = draft.title.trim();
    const label = draft.buttonLabel.trim();
    const href = draft.buttonHref.trim();
    if (!title) return setProblem("Give the slide a headline.");
    if (title.length > 80) return setProblem("Keep the headline under 80 characters.");
    if (Boolean(label) !== Boolean(href)) return setProblem("A button needs both its text and where it goes.");
    if (href && !/^(\/[^/]|https:\/\/)/.test(href)) return setProblem("The button link must be a page on the store (starting with /) or an https:// address.");
    if (draft.starts && draft.ends && Date.parse(draft.ends) <= Date.parse(draft.starts)) return setProblem("The end must be after the start.");
    setProblem("");
    const row = {
      title, subtitle: draft.subtitle.trim() || null, image_url: draft.image || null,
      button_label: label || null, button_href: href || null,
      starts_at: fromInput(draft.starts), ends_at: fromInput(draft.ends), countdown_to: fromInput(draft.countdown),
      is_active: draft.active, sort_order: toInt(draft.order) ?? 0,
    };
    const saved = await run(async () => {
      const supabase = await client();
      if (slide) await ok(supabase.from("announcements").update(row).eq("id", slide.id));
      else await ok(supabase.from("announcements").insert(row));
    }, slide ? "Saved." : "Slide added.");
    if (saved) onSaved();
  };

  const remove = async () => {
    if (slide && (await run(async () => ok((await client()).from("announcements").delete().eq("id", slide.id)), "Removed."))) onSaved();
    else setConfirmDelete(false);
  };

  return (
    <Card>
      <form onSubmit={save} className="flex flex-col gap-4" noValidate aria-label={slide ? `Slide ${slide.title}` : "Add a slide"}>
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="min-w-0 truncate font-display text-base font-bold text-text-primary">{slide ? slide.title : "Add a slide"}</h3>
          {slide && <span className="shrink-0 text-xs font-semibold text-text-muted">{status(slide, now)}</span>}
        </div>
        {(problem || message) && <Notice tone={problem ? "error" : message!.tone}>{problem || message!.text}</Notice>}
        <div className="grid gap-3 sm:grid-cols-2">
          <TextField label="Headline" value={draft.title} onChange={(e) => set("title", e.target.value)} placeholder="GTA 6 is coming" />
          <TextField label="Line under it" hint="Optional" value={draft.subtitle} onChange={(e) => set("subtitle", e.target.value)} placeholder="Pre-book now and play on day one" />
          <TextField label="Button text" hint="Optional" value={draft.buttonLabel} onChange={(e) => set("buttonLabel", e.target.value)} placeholder="Pre-book" />
          <TextField label="Button goes to" hint="A store page like /games/gta-5, or an https:// link" value={draft.buttonHref} onChange={(e) => set("buttonHref", e.target.value)} />
        </div>
        <ImageField label="Picture (wide)" kind="banner" folder="announcements" value={draft.image} onChange={(v) => set("image", v)} hint="Optional. Without one, the slide uses a coloured background." />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <TextField label="Show from" type="datetime-local" hint="Empty = now" value={draft.starts} onChange={(e) => set("starts", e.target.value)} />
          <TextField label="Show until" type="datetime-local" hint="Empty = until you switch it off" value={draft.ends} onChange={(e) => set("ends", e.target.value)} />
          <TextField label="Countdown to" type="datetime-local" hint="Optional, e.g. the launch time" value={draft.countdown} onChange={(e) => set("countdown", e.target.value)} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 sm:items-end">
          <TextField label="Order" inputMode="numeric" hint="Lower numbers come first" value={draft.order} onChange={(e) => set("order", e.target.value)} />
          <Toggle label="Switched on" checked={draft.active} onChange={(v) => set("active", v)} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="submit" disabled={busy}>{busy ? "Saving…" : slide ? "Save" : "Add slide"}</Button>
          {slide && !confirmDelete && <Button variant="ghost" onClick={() => setConfirmDelete(true)}>Remove slide</Button>}
          {slide && confirmDelete && (
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

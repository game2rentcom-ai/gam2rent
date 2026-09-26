import type { SupabaseClient } from "@supabase/supabase-js";
import { useState } from "react";
import { useAuth } from "../../auth/context";
import { Badge } from "../../ui/Chip";
import { Button } from "../../ui/Button";
import { IconStar } from "../../ui/icons";
import { Notice, SelectField, TextAreaField, TextField } from "../../ui/Form";
import { ok, useAction, useLoad } from "../../lib/api";
import { Card, ErrorNote, Loading, PageHeader, Toggle } from "../kit";

// Reviews shown on the store. Only verified ones are public. Customers' own reviews (from real
// orders) arrive automatically once online ordering is on; until then, add real feedback you've
// received — never invent one.
interface Review { id: string; game_id: string; rating: number; comment: string; verified: boolean; is_hidden?: boolean; reviewer_name?: string | null; created_at: string }

async function loadReviews(client: SupabaseClient) {
  const [reviews, games] = await Promise.all([
    ok(client.from("reviews").select("*").order("created_at", { ascending: false }).limit(200)),
    ok(client.from("games").select("id,title").order("title")),
  ]);
  return { reviews: reviews as Review[], games: games as { id: string; title: string }[] };
}

export function ReviewsPage() {
  const { data, error, loading, reload } = useLoad(loadReviews, undefined);
  if (loading) return <Loading />;
  if (error || !data) return <ErrorNote message={error ?? "Couldn’t load the reviews."} />;
  const titles = new Map(data.games.map((g) => [g.id, g.title]));
  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Reviews" subtitle={`${data.reviews.length} in total`} />
      <AddReview games={data.games} onAdded={reload} />
      {data.reviews.length === 0 && <p className="rounded-2xl border border-dashed border-border-subtle px-4 py-8 text-center text-sm text-text-muted">No reviews yet.</p>}
      <ul className="flex flex-col gap-3">
        {data.reviews.map((r) => <li key={r.id}><ReviewRow review={r} title={titles.get(r.game_id) ?? r.game_id} onChanged={reload} /></li>)}
      </ul>
    </div>
  );
}

function AddReview({ games, onAdded }: { games: { id: string; title: string }[]; onAdded: () => void }) {
  const { client } = useAuth();
  const { busy, message, run } = useAction();
  const [form, setForm] = useState({ game: "", rating: "5", comment: "", name: "" });
  const [problem, setProblem] = useState("");
  const set = (key: keyof typeof form, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.game) return setProblem("Choose the game.");
    if (!form.comment.trim()) return setProblem("Enter what the customer said.");
    setProblem("");
    const saved = await run(async () => {
      const supabase = await client();
      const row: Record<string, unknown> = { game_id: form.game, rating: Number(form.rating), comment: form.comment.trim(), verified: true };
      let { error } = await supabase.from("reviews").insert(form.name.trim() ? { ...row, reviewer_name: form.name.trim() } : row);
      // A database without the reviewer-name column still saves the review itself.
      if (error && form.name.trim() && /reviewer_name|column/i.test(error.message)) ({ error } = await supabase.from("reviews").insert(row));
      if (error) throw new Error(error.message);
    }, "Review added.");
    if (saved) {
      setForm({ game: "", rating: "5", comment: "", name: "" });
      onAdded();
    }
  };

  return (
    <Card>
      <form onSubmit={add} className="flex flex-col gap-4" noValidate>
        <h2 className="font-display text-lg font-bold text-text-primary">Add a review</h2>
        {(problem || message) && <Notice tone={problem ? "error" : message!.tone}>{problem || message!.text}</Notice>}
        <SelectField label="Game" value={form.game} onChange={(e) => set("game", e.target.value)}>
          <option value="">Choose a game…</option>
          {games.map((g) => <option key={g.id} value={g.id}>{g.title}</option>)}
        </SelectField>
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField label="Rating" value={form.rating} onChange={(e) => set("rating", e.target.value)}>
            {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} {n === 1 ? "star" : "stars"}</option>)}
          </SelectField>
          <TextField label="Customer’s first name" hint="Optional" value={form.name} onChange={(e) => set("name", e.target.value)} />
        </div>
        <TextAreaField label="What they said" value={form.comment} onChange={(e) => set("comment", e.target.value)} />
        <Button type="submit" size="lg" disabled={busy}>{busy ? "Adding…" : "Add review"}</Button>
      </form>
    </Card>
  );
}

function ReviewRow({ review, title, onChanged }: { review: Review; title: string; onChanged: () => void }) {
  const { client } = useAuth();
  const { busy, message, run } = useAction();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const update = (changes: Partial<Pick<Review, "verified" | "is_hidden">>) =>
    run(async () => ok((await client()).from("reviews").update(changes).eq("id", review.id)), "Updated.").then((done) => done && onChanged());
  const remove = () =>
    run(async () => ok((await client()).from("reviews").delete().eq("id", review.id)), "Deleted.").then((done) => (done ? onChanged() : setConfirmDelete(false)));

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="min-w-0 truncate text-sm font-bold text-text-primary">{title}</h3>
        <span className="flex items-center gap-1 text-rating-gold" aria-label={`${review.rating} out of 5`}>
          {Array.from({ length: review.rating }, (_, i) => <IconStar key={i} className="h-4 w-4" />)}
        </span>
      </div>
      <p className="text-sm text-text-muted">{review.comment}</p>
      <div className="flex flex-wrap gap-1.5">
        {review.reviewer_name && <Badge>{review.reviewer_name}</Badge>}
        <Badge tone={review.verified ? "trust" : "warn"}>{review.verified ? "Shown on the store" : "Not shown"}</Badge>
        {review.is_hidden && <Badge tone="warn">Hidden</Badge>}
      </div>
      {message?.tone === "error" && <Notice tone="error">{message.text}</Notice>}
      <div className="flex flex-col gap-1">
        <Toggle label="Show on the store" checked={review.verified && !review.is_hidden} onChange={(v) => void update(v ? { verified: true, ...(review.is_hidden !== undefined ? { is_hidden: false } : {}) } : { verified: false })} />
      </div>
      <div className="flex flex-wrap gap-2">
        {!confirmDelete ? <Button variant="ghost" onClick={() => setConfirmDelete(true)} disabled={busy}>Delete…</Button> : (
          <>
            <Button variant="secondary" onClick={() => void remove()} disabled={busy}>Yes, delete it</Button>
            <Button variant="ghost" onClick={() => setConfirmDelete(false)}>Cancel</Button>
          </>
        )}
      </div>
    </Card>
  );
}

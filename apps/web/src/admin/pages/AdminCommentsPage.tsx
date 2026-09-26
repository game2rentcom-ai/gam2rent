import type { SupabaseClient } from "@supabase/supabase-js";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/context";
import { ok, useAction, useLoad } from "../../lib/api";
import { formatDateTime } from "../../shop/orders";
import { Badge } from "../../ui/Chip";
import { Button } from "../../ui/Button";
import { Notice } from "../../ui/Form";
import { Card, ErrorNote, Loading, PageHeader } from "../kit";

// What customers have posted under games. Hide a comment to take it off the store without losing it, or
// delete it for good.
interface Row { id: string; game_id: string; author_name: string; body: string; status: "visible" | "hidden"; created_at: string }

async function loadComments(client: SupabaseClient) {
  const [comments, games] = await Promise.all([
    ok(client.from("game_comments").select("*").order("created_at", { ascending: false }).limit(100)),
    ok(client.from("games").select("id,title")),
  ]);
  return { comments: comments as Row[], titles: new Map((games as { id: string; title: string }[]).map((g) => [g.id, g.title])) };
}

export function AdminCommentsPage() {
  const { data, error, loading, reload } = useLoad(loadComments, undefined);
  if (loading) return <Loading />;
  if (error || !data) return <ErrorNote message={error ?? "Couldn’t load the comments."} />;
  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Comments" subtitle={`The latest ${data.comments.length} comments on games.`} />
      {data.comments.length === 0 && <p className="rounded-2xl border border-dashed border-border-subtle px-4 py-8 text-center text-sm text-text-muted">No comments yet.</p>}
      <ul className="flex flex-col gap-3">
        {data.comments.map((c) => <li key={c.id}><CommentRow comment={c} title={data.titles.get(c.game_id) ?? c.game_id} onChanged={reload} /></li>)}
      </ul>
    </div>
  );
}

function CommentRow({ comment, title, onChanged }: { comment: Row; title: string; onChanged: () => void }) {
  const { client } = useAuth();
  const { busy, message, run } = useAction();
  const [confirm, setConfirm] = useState(false);
  const hidden = comment.status === "hidden";
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link to={`/games/${comment.game_id}`} className="-my-2 flex min-h-11 min-w-11 items-center truncate text-sm font-bold text-text-primary hover:underline">{title}</Link>
        <span className="text-xs text-text-muted">{comment.author_name} · {formatDateTime(comment.created_at)}</span>
      </div>
      <p className="whitespace-pre-wrap break-words text-sm text-text-muted">{comment.body}</p>
      {hidden && <div><Badge tone="warn">Hidden from the store</Badge></div>}
      {message?.tone === "error" && <Notice tone="error">{message.text}</Notice>}
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" disabled={busy} onClick={() => void run(async () => ok((await client()).from("game_comments").update({ status: hidden ? "visible" : "hidden" }).eq("id", comment.id)), "Updated.").then((done) => done && onChanged())}>{hidden ? "Show again" : "Hide"}</Button>
        {!confirm ? <Button variant="ghost" onClick={() => setConfirm(true)}>Delete…</Button> : (
          <>
            <Button variant="secondary" disabled={busy} onClick={() => void run(async () => ok((await client()).from("game_comments").delete().eq("id", comment.id)), "Deleted.").then((done) => (done ? onChanged() : setConfirm(false)))}>Yes, delete it</Button>
            <Button variant="ghost" onClick={() => setConfirm(false)}>Cancel</Button>
          </>
        )}
      </div>
    </Card>
  );
}

import { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../auth/context";
import { readRemote } from "../data/remote";
import { ok, useAction } from "../lib/api";
import { formatDate } from "../shop/orders";
import { Button } from "../ui/Button";
import { Notice, TextAreaField } from "../ui/Form";
import { Section } from "../ui/Section";
import { backendConfigured } from "../lib/supabase";

// Open discussion under a game, apart from the verified reviews above it. Anyone can read; posting needs
// an account. If the database has no comments table the section is simply not shown.
interface Comment { id: string; user_id: string; author_name: string; body: string; created_at: string }

const problemText = (raw: string) =>
  raw.includes("slow_down") ? "You’re posting quickly. Please try again in a little while." : "We couldn’t post that right now. Please try again.";

export function GameComments({ gameId }: { gameId: string }) {
  const { status, user, client } = useAuth();
  const { pathname } = useLocation();
  const [loaded, setLoaded] = useState<{ gameId: string; rows: Comment[] | null; version: number } | null>(null);
  const [version, setVersion] = useState(0);
  const { busy, message, run } = useAction();
  const [text, setText] = useState("");
  const [problem, setProblem] = useState("");
  const reload = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    let cancelled = false;
    void readRemote<Comment[]>(`game_comments?select=id,user_id,author_name,body,created_at&game_id=eq.${encodeURIComponent(gameId)}&status=eq.visible&order=created_at.desc&limit=50`).then(
      (rows) => !cancelled && setLoaded({ gameId, rows, version }),
    );
    return () => {
      cancelled = true;
    };
  }, [gameId, version]);

  const rows = loaded?.gameId === gameId ? loaded.rows : null;
  if (!backendConfigured || rows === null) return null;

  const post = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return setProblem("Write something first.");
    setProblem("");
    const sent = await run(async () => {
      try {
        await ok((await client()).rpc("post_comment", { p_game: gameId, p_body: text.trim() }));
      } catch (e) {
        throw new Error(problemText(e instanceof Error ? e.message : ""));
      }
    }, "Posted.");
    if (sent) {
      setText("");
      reload();
    }
  };

  const remove = async (id: string) => {
    if (await run(async () => ok((await client()).from("game_comments").delete().eq("id", id)), "Deleted.")) reload();
  };

  return (
    <Section title="Comments">
      {rows.length === 0 && <p className="rounded-xl border border-dashed border-border-subtle px-4 py-6 text-center text-sm text-text-muted">No comments yet. Be the first to say something.</p>}
      <ul className="flex flex-col gap-3">
        {rows.map((c) => (
          <li key={c.id} className="rounded-xl border border-white/5 bg-bg-surface p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold text-text-primary">{c.author_name}</span>
              <span className="text-xs text-text-muted">{formatDate(c.created_at)}</span>
            </div>
            <p className="mt-2 whitespace-pre-wrap break-words text-sm text-text-muted">{c.body}</p>
            {c.user_id === user?.id && <button type="button" onClick={() => void remove(c.id)} disabled={busy} className="-mb-2 -ml-2 mt-1 flex min-h-11 items-center rounded-lg px-2 text-sm font-semibold text-text-muted hover:text-text-primary">Delete my comment</button>}
          </li>
        ))}
      </ul>
      {message?.tone === "error" && <Notice tone="error">{message.text}</Notice>}
      {status === "signed-in" ? (
        <form onSubmit={post} className="flex flex-col gap-3" noValidate aria-label="Add a comment">
          {problem && <Notice tone="error">{problem}</Notice>}
          <TextAreaField label="Add a comment" maxLength={1000} value={text} onChange={(e) => setText(e.target.value)} />
          <div><Button type="submit" disabled={busy}>{busy ? "Posting…" : "Post comment"}</Button></div>
        </form>
      ) : status === "anonymous" ? (
        <Button to={`/login?next=${encodeURIComponent(pathname)}`} variant="secondary">Log in to comment</Button>
      ) : null}
      {status === "signed-in" && <p className="text-xs text-text-muted">Comments are public and show your first name.</p>}
    </Section>
  );
}

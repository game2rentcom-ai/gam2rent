import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { useAuth } from "../auth/context";
import { PLATFORM_LABEL, type Platform } from "../data/catalogTypes";
import { readRemote } from "../data/remote";
import { useStore } from "../data/store";
import { ok, useAction } from "../lib/api";
import { searchGames } from "../lib/search";
import { Badge } from "../ui/Chip";
import { Button } from "../ui/Button";
import { Notice, SelectField, TextAreaField, TextField } from "../ui/Form";
import { IconCheck } from "../ui/icons";

// The request board: anyone can see what people have asked for and how many want each game; signed-in
// customers can ask for a game (asking for one that's already listed adds their vote instead) and vote.
// Who asked and who voted is never shown.
interface Request { id: string; title: string; platform: Platform | null; note: string | null; status: "open" | "planned" | "added"; votes: number; voted_by_me: boolean }
const STATUS: Record<Request["status"], { label: string; tone: "neutral" | "brand" | "trust" | "warn" }> = {
  open: { label: "Requested", tone: "neutral" },
  planned: { label: "Planned", tone: "brand" },
  added: { label: "Added to the store", tone: "trust" },
};
const BOARD = "game_request_board?select=id,title,platform,note,status,votes,voted_by_me&order=votes.desc,created_at.desc&limit=100";

export function RequestsPage() {
  const { status, client } = useAuth();
  const { games, contactLink } = useStore();
  const { pathname } = useLocation();
  const [params] = useSearchParams();
  const [board, setBoard] = useState<{ who: string; rows: Request[] | null } | null>(null);
  const [version, setVersion] = useState(0);
  const [title, setTitle] = useState(params.get("title") ?? "");
  const [platform, setPlatform] = useState("");
  const [note, setNote] = useState("");
  const [problem, setProblem] = useState("");
  const [voteProblem, setVoteProblem] = useState("");
  const { busy, message, run } = useAction();
  const who = status === "signed-in" ? "me" : "guest";
  const reload = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    if (status === "loading") return;
    let cancelled = false;
    const load: Promise<Request[] | null> =
      status === "signed-in"
        ? client().then(async (c) => {
            const { data, error } = await c.from("game_request_board").select("id,title,platform,note,status,votes,voted_by_me").order("votes", { ascending: false }).order("created_at", { ascending: false }).limit(100);
            return error ? null : (data as Request[]);
          })
        : readRemote<Request[]>(BOARD);
    load.then(
      (rows) => !cancelled && setBoard({ who, rows }),
      () => !cancelled && setBoard({ who, rows: null }),
    );
    return () => {
      cancelled = true;
    };
  }, [status, who, client, version]);

  const rows = board?.who === who ? board.rows : undefined;
  const already = useMemo(() => (title.trim().length >= 3 ? searchGames(games, title, 3) : []), [games, title]);
  const chat = contactLink("Hi! There's a game I'd like you to add.");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim().length < 2) return setProblem("Enter the game’s name.");
    setProblem("");
    const sent = await run(async () => {
      try {
        await ok((await client()).rpc("request_game", { p_title: title.trim(), p_platform: platform || null, p_note: note.trim() || null }));
      } catch (e) {
        throw new Error(e instanceof Error && e.message.includes("slow_down") ? "You’ve sent a few requests today already. Please try again tomorrow." : "We couldn’t save that right now. Please try again.");
      }
    }, "Thanks! It’s on the list — and if someone had already asked for it, you’ve added your vote.");
    if (sent) {
      setTitle("");
      setPlatform("");
      setNote("");
      reload();
    }
  };

  const vote = async (id: string) => {
    setVoteProblem("");
    try {
      await ok((await client()).rpc("toggle_request_vote", { p_request: id }));
      reload();
    } catch {
      setVoteProblem("We couldn’t record your vote. Please try again.");
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 py-2 sm:py-6">
      <header>
        <h1 className="font-display text-3xl font-black text-text-primary">Request a game</h1>
        <p className="mt-1 text-sm text-text-muted">Tell us what you’d like to play. The more people ask for a game, the sooner we look into getting it.</p>
      </header>

      {status === "signed-in" ? (
        <form onSubmit={submit} className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-bg-surface p-4 sm:p-5" noValidate aria-label="Request a game">
          {(problem || message) && <Notice tone={problem ? "error" : message!.tone}>{problem || message!.text}</Notice>}
          <TextField label="Game name" maxLength={100} value={title} onChange={(e) => setTitle(e.target.value)} />
          {already.length > 0 && (
            <div className="rounded-xl bg-bg-base p-3 text-sm">
              <p className="font-semibold text-text-primary">Already in the store?</p>
              <ul className="mt-1">{already.map((g) => <li key={g.id}><Link to={`/games/${g.id}`} className="flex min-h-11 items-center font-semibold text-brand-500">{g.title}</Link></li>)}</ul>
            </div>
          )}
          <SelectField label="Platform" value={platform} onChange={(e) => setPlatform(e.target.value)}>
            <option value="">Any</option>
            {(Object.keys(PLATFORM_LABEL) as Platform[]).map((p) => <option key={p} value={p}>{PLATFORM_LABEL[p]}</option>)}
          </SelectField>
          <TextAreaField label="Anything else?" hint="Optional" maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} />
          <div><Button type="submit" size="lg" disabled={busy}>{busy ? "Sending…" : "Send request"}</Button></div>
        </form>
      ) : status === "anonymous" ? (
        <div className="flex flex-col items-start gap-3 rounded-2xl border border-white/10 bg-bg-surface p-4 sm:p-5">
          <p className="text-sm text-text-muted">Log in to ask for a game or vote for one below.</p>
          <Button to={`/login?next=${encodeURIComponent(pathname)}`}>Log in</Button>
        </div>
      ) : null}

      <h2 className="font-display text-lg font-bold text-text-primary">What people are asking for</h2>
      {rows === undefined && <div className="h-32 animate-pulse rounded-2xl bg-bg-surface" aria-busy="true" aria-label="Loading requests" />}
      {rows === null && <Notice tone="error">The request list isn’t available right now. {chat && <a href={chat} target="_blank" rel="noopener noreferrer" className="link-tap font-semibold underline">Message us instead</a>}</Notice>}
      {voteProblem && <Notice tone="error">{voteProblem}</Notice>}
      {rows && rows.length === 0 && <p className="rounded-2xl border border-dashed border-border-subtle px-4 py-8 text-center text-sm text-text-muted">No requests yet. Be the first.</p>}
      <ul className="flex flex-col gap-2">
        {rows?.map((r) => {
          const state = STATUS[r.status];
          return (
            <li key={r.id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-bg-surface p-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-text-primary">{r.title}</p>
                <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-text-muted"><Badge tone={state.tone}>{state.label}</Badge>{r.platform ? PLATFORM_LABEL[r.platform] : "Any platform"}</p>
                {r.note && <p className="mt-1 text-xs text-text-muted">{r.note}</p>}
              </div>
              {status === "signed-in" ? (
                <button type="button" aria-pressed={r.voted_by_me} aria-label={`${r.voted_by_me ? "Remove your vote for" : "Vote for"} ${r.title}, ${r.votes} ${r.votes === 1 ? "vote" : "votes"}`} onClick={() => void vote(r.id)} className={`flex min-h-14 min-w-16 flex-col items-center justify-center rounded-xl border px-2 text-xs font-semibold ${r.voted_by_me ? "border-brand-500 bg-brand-500/15 text-text-primary" : "border-border-subtle text-text-muted hover:border-white/30"}`}>
                  {r.voted_by_me ? <IconCheck className="h-5 w-5" /> : <span aria-hidden="true">＋</span>}
                  <span>{r.votes}</span>
                </button>
              ) : (
                <span className="flex min-h-14 min-w-16 flex-col items-center justify-center rounded-xl border border-border-subtle px-2 text-xs font-semibold text-text-muted"><span>{r.votes}</span><span>{r.votes === 1 ? "vote" : "votes"}</span></span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

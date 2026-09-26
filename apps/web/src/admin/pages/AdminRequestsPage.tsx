import type { SupabaseClient } from "@supabase/supabase-js";
import { useState } from "react";
import { useAuth } from "../../auth/context";
import { PLATFORM_LABEL, type Platform } from "../../data/catalogTypes";
import { ok, useAction, useLoad } from "../../lib/api";
import { formatDate } from "../../shop/orders";
import { Button } from "../../ui/Button";
import { Notice, SelectField } from "../../ui/Form";
import { Card, ErrorNote, Loading, PageHeader } from "../kit";

// Games customers have asked for, most wanted first. Mark a request planned once you're looking into it,
// added once it's in the store, or declined to take it off the public list.
interface Row { id: string; title: string; platform: Platform | null; note: string | null; status: "open" | "planned" | "added" | "declined"; created_at: string }
const STATUSES: [Row["status"], string][] = [["open", "Requested"], ["planned", "Planned"], ["added", "Added to the store"], ["declined", "Declined (hidden)"]];

async function loadRequests(client: SupabaseClient) {
  const [requests, votes] = await Promise.all([
    ok(client.from("game_requests").select("*").order("created_at", { ascending: false }).limit(200)),
    ok(client.from("game_request_votes").select("request_id")),
  ]);
  const counts = new Map<string, number>();
  for (const v of votes as { request_id: string }[]) counts.set(v.request_id, (counts.get(v.request_id) ?? 0) + 1);
  return { requests: (requests as Row[]).sort((a, b) => (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0)), counts };
}

export function AdminRequestsPage() {
  const { data, error, loading, reload } = useLoad(loadRequests, undefined);
  if (loading) return <Loading />;
  if (error || !data) return <ErrorNote message={error ?? "Couldn’t load the requests."} />;
  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Game requests" subtitle={`${data.requests.length} in total, most wanted first.`} />
      {data.requests.length === 0 && <p className="rounded-2xl border border-dashed border-border-subtle px-4 py-8 text-center text-sm text-text-muted">No requests yet.</p>}
      <ul className="flex flex-col gap-3">
        {data.requests.map((r) => <li key={r.id}><RequestRow request={r} votes={data.counts.get(r.id) ?? 0} onChanged={reload} /></li>)}
      </ul>
    </div>
  );
}

function RequestRow({ request, votes, onChanged }: { request: Row; votes: number; onChanged: () => void }) {
  const { client } = useAuth();
  const { busy, message, run } = useAction();
  const [confirm, setConfirm] = useState(false);
  // The chosen value is read before anything is awaited: a controlled select snaps back once the event ends.
  const setStatus = (status: string) => void run(async () => ok((await client()).from("game_requests").update({ status }).eq("id", request.id)), "Updated.").then((done) => done && onChanged());
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-bold text-text-primary">{request.title}</h2>
        <span className="text-xs text-text-muted">{votes} {votes === 1 ? "vote" : "votes"} · {request.platform ? PLATFORM_LABEL[request.platform] : "any platform"} · {formatDate(request.created_at)}</span>
      </div>
      {request.note && <p className="text-sm text-text-muted">{request.note}</p>}
      {message?.tone === "error" && <Notice tone="error">{message.text}</Notice>}
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-48 flex-1">
          <SelectField label="Status" value={request.status} disabled={busy} onChange={(e) => setStatus(e.target.value)}>
            {STATUSES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </SelectField>
        </div>
        {!confirm ? <Button variant="ghost" onClick={() => setConfirm(true)}>Delete…</Button> : (
          <>
            <Button variant="secondary" disabled={busy} onClick={() => void run(async () => ok((await client()).from("game_requests").delete().eq("id", request.id)), "Deleted.").then((done) => (done ? onChanged() : setConfirm(false)))}>Yes, delete it</Button>
            <Button variant="ghost" onClick={() => setConfirm(false)}>Cancel</Button>
          </>
        )}
      </div>
    </Card>
  );
}

import type { SupabaseClient } from "@supabase/supabase-js";
import { Badge } from "../../ui/Chip";
import { ok, useLoad } from "../../lib/api";
import { ErrorNote, Loading, PageHeader } from "../kit";

// A record of every change made to prices, games, reviews and settings — who, when, and what it was
// before. Written by the database itself, so it can't be skipped or edited.
interface Entry { id: number; at: string; actor: string | null; table_name: string; action: string; row_key: string | null; old_row: Record<string, unknown> | null; new_row: Record<string, unknown> | null }

async function loadAudit(client: SupabaseClient) {
  return (await ok(client.from("audit_log").select("*").order("id", { ascending: false }).limit(100))) as Entry[];
}

// The database identifies most rows by an id nobody can read; name them by what the owner would recognise.
const NAME_FIELD: Record<string, string> = { games: "title", listings: "game_id", reviews: "game_id", rental_plans: "label" };
const subject = (e: Entry) => {
  const row = e.new_row ?? e.old_row;
  const name = row?.[NAME_FIELD[e.table_name]];
  return typeof name === "string" && name ? name : e.row_key;
};

const show = (v: unknown) => (v === null || v === undefined ? "—" : typeof v === "object" ? JSON.stringify(v) : String(v));

function changes(e: Entry): [string, unknown, unknown][] {
  if (e.action === "UPDATE" && e.old_row && e.new_row) return Object.keys(e.new_row).filter((k) => k !== "updated_at" && JSON.stringify(e.old_row![k]) !== JSON.stringify(e.new_row![k])).map((k) => [k, e.old_row![k], e.new_row![k]]);
  const row = e.new_row ?? e.old_row ?? {};
  return Object.entries(row).filter(([k]) => !["created_at", "updated_at"].includes(k)).map(([k, v]) => [k, undefined, v]);
}

export function AuditPage() {
  const { data, error, loading } = useLoad(loadAudit, undefined);
  if (loading) return <Loading />;
  if (error || !data) return <ErrorNote message={error ?? "Couldn’t load the history."} />;
  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="History" subtitle="The last 100 changes, newest first." />
      {data.length === 0 && <p className="rounded-2xl border border-dashed border-border-subtle px-4 py-8 text-center text-sm text-text-muted">No changes recorded yet.</p>}
      <ul className="flex flex-col gap-2">
        {data.map((e) => (
          <li key={e.id}>
            <details className="panel">
              <summary className="flex min-h-14 cursor-pointer list-none flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2">
                <Badge tone={e.action === "DELETE" ? "warn" : e.action === "INSERT" ? "trust" : "neutral"}>{e.action}</Badge>
                <span className="text-sm font-semibold text-text-primary">{e.table_name}{subject(e) ? ` · ${subject(e)}` : ""}</span>
                <span className="ml-auto text-xs text-text-muted">{new Date(e.at).toLocaleString("en-IN")} · {e.actor ? "signed-in admin" : "dashboard"}</span>
              </summary>
              <dl className="grid gap-1 border-t border-border-subtle px-4 py-3 text-xs">
                {changes(e).map(([k, before, after]) => (
                  <div key={k} className="flex flex-wrap gap-x-2"><dt className="font-semibold text-text-primary">{k}</dt><dd className="min-w-0 break-words text-text-muted">{before === undefined ? show(after) : `${show(before)} → ${show(after)}`}</dd></div>
                ))}
              </dl>
            </details>
          </li>
        ))}
      </ul>
    </div>
  );
}

import type { SupabaseClient } from "@supabase/supabase-js";
import { useState } from "react";
import { useAuth } from "../../auth/context";
import { ok, useAction, useLoad } from "../../lib/api";
import { formatDate } from "../../shop/orders";
import { Button } from "../../ui/Button";
import { Badge } from "../../ui/Chip";
import { Notice, TextField } from "../../ui/Form";
import { Card, ErrorNote, Loading, PageHeader } from "../kit";

// Who can run the store. Every admin can see every order and every customer's details, so add only people you
// trust. Someone must have created an account on the store first; then adding their email here makes them an admin.
// The database checks all of this — this screen only asks.
interface Admin { user_id: string; email: string; added_at: string }

async function loadAdmins(client: SupabaseClient) {
  return (await ok(client.rpc("admin_list_admins"))) as Admin[];
}

const problemText = (message: string) =>
  /unknown_user/.test(message) ? "There is no account with that email. Ask them to create an account on the store first, then add them here."
  : /cannot_remove_self/.test(message) ? "You can’t remove yourself — ask another admin to do it."
  : message;

export function TeamPage() {
  const { data, error, loading, reload } = useLoad(loadAdmins, undefined);
  const { user, client } = useAuth();
  const { busy, message, run } = useAction();
  const [email, setEmail] = useState("");
  const [removing, setRemoving] = useState("");

  if (loading) return <Loading />;
  if (error || !data) return <ErrorNote message={error ?? "Couldn’t load the team."} onRetry={reload} />;

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    const added = await run(async () => ok((await client()).rpc("admin_add_admin", { p_email: email })), "Added — they can open the admin area now.");
    if (added) {
      setEmail("");
      reload();
    }
  };
  const remove = async (id: string) => {
    const removed = await run(async () => ok((await client()).rpc("admin_remove_admin", { p_user: id })), "Removed.");
    setRemoving("");
    if (removed) reload();
  };

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Team" subtitle="The people who can run the store. Every admin can see every order and customer, so add only people you trust." />
      {message && <Notice tone={message.tone}>{message.tone === "error" ? problemText(message.text) : message.text}</Notice>}

      <Card>
        <form onSubmit={add} className="flex flex-col gap-3 sm:flex-row sm:items-end" noValidate>
          <div className="min-w-0 flex-1">
            <TextField label="Add an admin by email" type="email" autoComplete="off" hint="They need an account on the store first." value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <Button type="submit" disabled={busy || !email.trim()}>Add admin</Button>
        </form>
      </Card>

      <ul className="flex flex-col gap-2">
        {data.map((a) => (
          <li key={a.user_id}>
            <Card className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-text-primary">{a.email}{a.user_id === user?.id && <Badge tone="brand"> You</Badge>}</p>
                <p className="text-xs text-text-muted">Admin since {formatDate(a.added_at)}</p>
              </div>
              {a.user_id !== user?.id && (removing === a.user_id ? (
                <div className="flex gap-2">
                  <Button variant="secondary" disabled={busy} onClick={() => void remove(a.user_id)}>Yes, remove</Button>
                  <Button variant="ghost" onClick={() => setRemoving("")}>Keep</Button>
                </div>
              ) : (
                <Button variant="ghost" onClick={() => setRemoving(a.user_id)}>Remove…</Button>
              ))}
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}

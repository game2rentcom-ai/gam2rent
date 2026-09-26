import { useState } from "react";
import { useAuth } from "../auth/context";
import { ok, useAction } from "../lib/api";
import { formatDateTime } from "../shop/orders";
import { Button } from "../ui/Button";
import { Notice, TextAreaField } from "../ui/Form";
import { ticketProblem, type TicketMessage } from "./tickets";

// A conversation, oldest first, with a box to reply. `viewer` says whose messages sit on the right.
export function Thread({ ticketId, messages, viewer, closed, onSent }: { ticketId: string; messages: TicketMessage[]; viewer: "customer" | "admin"; closed: boolean; onSent: () => void }) {
  const { client } = useAuth();
  const { busy, message, run } = useAction();
  const [text, setText] = useState("");
  const [problem, setProblem] = useState("");

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return setProblem("Write your message first.");
    setProblem("");
    const sent = await run(async () => {
      try {
        await ok((await client()).rpc("reply_ticket", { p_ticket: ticketId, p_message: text.trim() }));
      } catch (e) {
        throw new Error(ticketProblem(e instanceof Error ? e.message : ""));
      }
    }, "Sent.");
    if (sent) {
      setText("");
      onSent();
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-3" aria-label="Messages">
        {messages.map((m) => {
          const mine = m.sender_role === viewer;
          return (
            <li key={m.id} className={`flex flex-col gap-1 ${mine ? "items-end" : "items-start"}`}>
              <div className={`max-w-[88%] whitespace-pre-wrap break-words rounded-2xl px-4 py-2.5 text-sm ${mine ? "rounded-br-md bg-brand-500 text-white" : "rounded-bl-md border border-white/10 bg-bg-surface text-text-primary"}`}>{m.message}</div>
              <span className="px-1 text-xs text-text-muted">{m.sender_role === "admin" ? "Support" : "Customer"} · {formatDateTime(m.created_at)}</span>
            </li>
          );
        })}
      </ul>
      {closed ? (
        <p className="rounded-xl border border-dashed border-border-subtle px-4 py-3 text-center text-sm text-text-muted">This request is closed.</p>
      ) : (
        <form onSubmit={send} className="flex flex-col gap-3" noValidate aria-label="Reply">
          {(problem || (message && message.tone === "error")) && <Notice tone="error">{problem || message!.text}</Notice>}
          <TextAreaField label="Your message" value={text} onChange={(e) => setText(e.target.value)} maxLength={4000} />
          <div><Button type="submit" disabled={busy}>{busy ? "Sending…" : "Send"}</Button></div>
        </form>
      )}
    </div>
  );
}

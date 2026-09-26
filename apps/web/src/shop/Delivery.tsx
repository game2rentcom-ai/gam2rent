import { useState } from "react";
import { useAuth } from "../auth/context";
import { Button } from "../ui/Button";
import { callFunction, paymentProblem } from "./checkout";

// A delivered item's login details. They are fetched only when asked for: the server function checks
// that the asker owns the order (or is the admin — which is written to the history), decrypts, and
// returns them. Never printed, never kept in the page after it closes.
interface Delivered { delivered: boolean; credential_type?: string; payload?: unknown; note?: string | null }
const LABELS: Record<string, string> = { login: "Login", password: "Password", qr: "QR code or link", text: "Details" };

export function Delivery({ itemId, buttonLabel = "Show my login details", intro = "Your details — keep them private." }: { itemId: string; buttonLabel?: string; intro?: string }) {
  const { client } = useAuth();
  const [state, setState] = useState<{ busy?: boolean; error?: string; data?: Delivered }>({});

  const reveal = async () => {
    setState({ busy: true });
    try {
      setState({ data: await callFunction<Delivered>(await client(), "get-delivery", { order_item_id: itemId }) });
    } catch (e) {
      setState({ error: paymentProblem(e).text });
    }
  };

  if (!state.data) {
    return (
      <div className="mt-3 flex flex-col gap-2 print:hidden">
        <Button variant="secondary" onClick={() => void reveal()} disabled={state.busy}>{state.busy ? "Opening…" : buttonLabel}</Button>
        {state.error && <p role="alert" className="text-xs font-medium text-red-300">{state.error}</p>}
      </div>
    );
  }
  const { delivered, payload, note } = state.data;
  if (!delivered) return <p className="mt-3 text-xs text-text-muted print:hidden">No details to show yet.</p>;
  const entries: [string, unknown][] = payload && typeof payload === "object" ? Object.entries(payload) : [["text", payload]];
  return (
    <div className="mt-3 flex flex-col gap-2 rounded-xl border border-trust-300 bg-trust-100/40 p-3 print:hidden">
      <p className="text-xs font-semibold text-text-primary">{intro}</p>
      <dl className="flex flex-col gap-2">
        {entries.map(([key, value]) => (
          <div key={key} className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <dt className="text-xs text-text-muted">{LABELS[key] ?? key}</dt>
              <dd className="break-all font-mono text-sm text-text-primary">{String(value)}</dd>
            </div>
            <CopyButton value={String(value)} label={LABELS[key] ?? key} />
          </div>
        ))}
      </dl>
      {note && <p className="text-xs text-text-muted">{note}</p>}
    </div>
  );
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="ghost"
      size="sm"
      aria-label={`Copy ${label}`}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch { /* clipboard blocked: the value is on screen to copy by hand */ }
      }}
    >
      {copied ? "Copied" : "Copy"}
    </Button>
  );
}

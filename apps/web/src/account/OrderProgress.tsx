import type { OrderStatus } from "../shop/orders";
import { IconCheck } from "../ui/icons";

// The order as a three-step quest. Every state comes from the order's real status; orders that are
// unpaid, cancelled or refunded aren't on this path, so they show nothing here.
const STEPS = ["Paid", "Being prepared", "Delivered"];
// Steps completed, and how far along the track (%) the order has travelled.
const PROGRESS: Partial<Record<OrderStatus, { done: number; track: number }>> = {
  paid: { done: 1, track: 0 },
  in_progress: { done: 1, track: 50 },
  delivered: { done: 3, track: 100 },
};

export function OrderProgress({ status }: { status: OrderStatus }) {
  const progress = PROGRESS[status];
  if (!progress) return null;
  return (
    <div className="panel hud relative px-2 py-4 print:hidden">
      <div aria-hidden="true" className="absolute left-[16.67%] right-[16.67%] top-[2.3rem] h-0.5 bg-border-strong">
        <div className="h-full bg-linear-to-r from-trust-600 to-accent-400 shadow-glow-cyan" style={{ width: `${progress.track}%` }} />
      </div>
      <ol aria-label="Order progress" className="grid grid-cols-3 gap-2">
        {STEPS.map((label, i) => {
          const state = i < progress.done ? "done" : status === "in_progress" && i === progress.done ? "current" : "todo";
          const tone = state === "done" ? "[--medal:var(--color-trust-600)]" : state === "current" ? "medal-live [--medal:var(--color-accent-400)]" : "[--medal:var(--color-text-muted)] [filter:none]";
          return (
            <li key={label} aria-current={state === "current" ? "step" : undefined} className="flex flex-col items-center gap-2 text-center">
              <span aria-hidden="true" className={`medal cut cut-hex font-display text-lg font-bold ${tone}`}>{state === "done" ? <IconCheck className="h-6 w-6" /> : i + 1}</span>
              <span className={`text-sm font-semibold ${state === "todo" ? "text-text-muted" : state === "current" ? "text-accent-300" : "text-text-primary"}`}>
                {label}
                <span className="sr-only">{state === "done" ? ", done" : state === "current" ? ", in progress" : ", not yet"}</span>
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

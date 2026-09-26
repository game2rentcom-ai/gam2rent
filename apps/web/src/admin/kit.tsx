import { Notice } from "../ui/Form";

// Small visual pieces shared by the admin screens (data helpers live in hooks.ts).

export function Loading({ label = "Loading…" }: { label?: string }) {
  return <div className="h-40 animate-pulse rounded-2xl bg-bg-surface" aria-busy="true" aria-label={label} />;
}

export function ErrorNote({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return <Notice tone="error" onRetry={onRetry}>{message}</Notice>;
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="font-display text-2xl font-bold text-text-primary sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-text-muted">{subtitle}</p>}
      </div>
      {actions}
    </div>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`panel p-4 sm:p-5 ${className}`}>{children}</div>;
}

/** An on/off switch with a label, at least 44 px tall. */
export function Toggle({ label, checked, onChange, hint }: { label: string; checked: boolean; onChange: (value: boolean) => void; hint?: string }) {
  return (
    <div className="flex min-h-11 items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-text-primary">{label}</p>
        {hint && <p className="text-xs text-text-muted">{hint}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className="flex h-11 w-14 shrink-0 items-center"
      >
        <span className={`relative block h-8 w-14 rounded-full transition-colors ${checked ? "bg-brand-500 shadow-glow-brand" : "bg-white/15"}`}>
          <span className={`absolute top-1 h-6 w-6 rounded-full bg-white transition-all ${checked ? "left-7" : "left-1"}`} />
        </span>
      </button>
    </div>
  );
}

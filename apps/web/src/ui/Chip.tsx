// A toggleable pill for filters and options. 40 px tall so it is a comfortable tap target.
interface Props {
  selected?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}

export function Chip({ selected = false, onClick, children, className = "" }: Props) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`inline-flex min-h-10 shrink-0 items-center justify-center gap-1.5 rounded-full border px-4 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 ${
        selected
          ? "border-brand-500 bg-brand-500 text-white"
          : "border-border-subtle bg-bg-surface text-text-muted hover:border-white/30 hover:text-text-primary"
      } ${className}`}
    >
      {children}
    </button>
  );
}

// A small non-interactive label. Never smaller than 12 px.
export function Badge({ children, tone = "neutral", className = "" }: { children: React.ReactNode; tone?: "neutral" | "brand" | "trust" | "warn"; className?: string }) {
  const tones = {
    neutral: "border-white/10 bg-black/50 text-text-primary",
    brand: "border-brand-500/40 bg-brand-500/15 text-brand-100",
    trust: "border-trust-300 bg-trust-100 text-trust-600",
    warn: "border-amber-400/40 bg-amber-400/15 text-amber-300",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-semibold leading-5 ${tones[tone]} ${className}`}>
      {children}
    </span>
  );
}

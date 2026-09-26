// A toggleable pill for filters and options. 40 px tall so it is a comfortable tap target.
interface Props {
  selected?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}

export function Chip({ selected = false, onClick, children, className = "" }: Props) {
  return (
    <button type="button" aria-pressed={selected} onClick={onClick} className={`chip cut ${className}`}>
      {children}
    </button>
  );
}

// A small non-interactive label. Never smaller than 12 px.
export function Badge({ children, tone = "neutral", className = "" }: { children: React.ReactNode; tone?: "neutral" | "brand" | "trust" | "warn" | "rare"; className?: string }) {
  return <span className={`badge badge-${tone} cut ${className}`}>{children}</span>;
}

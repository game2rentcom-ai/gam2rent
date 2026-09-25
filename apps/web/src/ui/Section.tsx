import { Link } from "react-router-dom";
import { IconChevron } from "./icons";

// A page section: consistent vertical rhythm, a heading, and an optional "see all" link.
interface Props {
  title: string;
  eyebrow?: string;
  /** router path for the "see all" link */
  moreTo?: string;
  moreLabel?: string;
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export function Section({ title, eyebrow, moreTo, moreLabel = "See all", children, className = "", id }: Props) {
  return (
    <section id={id} className={`flex flex-col gap-4 ${className}`}>
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          {eyebrow && <p className="text-xs font-bold uppercase tracking-wider text-brand-500">{eyebrow}</p>}
          <h2 className="font-display text-xl font-black leading-tight text-text-primary sm:text-2xl">{title}</h2>
        </div>
        {moreTo && (
          <Link to={moreTo} className="-mr-2 flex min-h-11 shrink-0 items-center gap-1 px-2 text-sm font-semibold text-brand-500 hover:text-brand-100">
            {moreLabel}
            <IconChevron className="h-4 w-4" />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

/** A horizontal row that scrolls and snaps on touch screens (no arrows needed). */
export function Rail({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div
      role="region"
      aria-label={label}
      className="no-scrollbar -mx-4 flex snap-x snap-proximity gap-3 overflow-x-auto scroll-px-4 px-4 pb-1 sm:mx-0 sm:gap-4 sm:px-0"
    >
      {children}
    </div>
  );
}

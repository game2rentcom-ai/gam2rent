import { Fragment } from "react";
import type { Platform } from "../data/catalogTypes";
import { PLATFORM_LABEL } from "../data/catalogTypes";
import { PLATFORM_SHORT, PLATFORM_TEXT } from "../ui/format";

// One badge vocabulary, reused everywhere a listing is shown (grid card, featured rail, detail
// page) — per ux-principles.md #5 and the "component contract." Iteration 3: platform glyphs
// redrawn bolder/simpler after the round-2 versions tested as illegible at small size (read as
// an ambiguous padlock, not a platform) — see brainstorm/iteration-3-ux-designer.md §2c. Each
// platform also has its own colour (see --color-plat-* in index.css), so the grid is scannable
// by platform at a glance, like a real game library.

export function PlatformBadge({ platform }: { platform: Platform }) {
  return (
    <span className={`badge badge-${platform} cut`}>
      <PlatformGlyph platform={platform} className="h-3.5 w-3.5" />
      {PLATFORM_LABEL[platform]}
    </span>
  );
}

/** "PC · PS4 · PS5" with each name in its platform's colour. */
export function PlatformLine({ platforms }: { platforms: Platform[] }) {
  return (
    <>
      {platforms.map((p, i) => (
        <Fragment key={p}>
          {i > 0 && " · "}
          <span className={PLATFORM_TEXT[p]}>{PLATFORM_SHORT[p]}</span>
        </Fragment>
      ))}
    </>
  );
}

// Trust-related facts (ETA, replacement guarantee, verified badge) always use the trust pill —
// a distinct semantic category from the brand color, so they read as one recognizable group
// wherever they appear (documentation/brainstorm/ux-designer-perspective.md §4).
export function EtaBadge({ label }: { label: string }) {
  return (
    <span className="trust-pill">
      <ClockIcon />
      {label}
    </span>
  );
}

export function RatingChip({ rating, count }: { rating: number | null; count: number }) {
  if (rating === null) {
    return <span className="text-xs font-medium text-text-muted">No reviews yet</span>;
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-text-primary">
      <StarIcon />
      {rating.toFixed(1)}
      <span className="font-normal text-text-muted">({count})</span>
    </span>
  );
}

export function UnavailableBadge() {
  return (
    <span className="inline-flex items-center rounded-lg border border-white/10 bg-bg-surface-raised px-2.5 py-1 text-xs font-medium text-text-muted">
      Currently unavailable
    </span>
  );
}

// Exported (not just used internally) so ListingCard and the dashboard hero can reuse the same
// shape as a large watermark — one icon definition, several sizes. Redrawn bold/simple on
// purpose: thick strokes, minimal internal detail, so the silhouette reads correctly at both a
// 14px badge and a 96px watermark instead of becoming a different, ambiguous shape at scale.
export function PlatformGlyph({ platform, className }: { platform: Platform; className: string }) {
  if (platform === "pc") {
    return (
      <svg viewBox="0 0 20 20" fill="currentColor" className={className}>
        <rect x="2" y="3" width="16" height="11" rx="1.5" />
        <rect x="8" y="15.5" width="4" height="2" />
        <rect x="5.5" y="17.5" width="9" height="1.5" rx="0.75" />
      </svg>
    );
  }
  if (platform === "cloud") {
    return (
      <svg viewBox="0 0 20 20" fill="currentColor" className={className}>
        <path d="M5.5 15.5a3.5 3.5 0 01-.5-6.96 4.5 4.5 0 018.55-1.9A3.25 3.25 0 0117 9.9a3 3 0 01-.5 5.6H5.5z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className}>
      <rect x="1" y="7.5" width="18" height="6" rx="3" />
      <circle cx="4.5" cy="14" r="2.4" />
      <circle cx="15.5" cy="14" r="2.4" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-12a.75.75 0 00-1.5 0v4c0 .2.08.39.22.53l2.5 2.5a.75.75 0 101.06-1.06l-2.28-2.28V6z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3 text-rating-gold">
      <path d="M10 1.5l2.6 5.27 5.82.85-4.21 4.1 1 5.8L10 14.9l-5.21 2.74 1-5.8-4.21-4.1 5.82-.85z" />
    </svg>
  );
}

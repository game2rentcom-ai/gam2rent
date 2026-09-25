import { useEffect, useRef, useState } from "react";
import { useStore } from "../data/store";
import { m } from "motion/react";

// Every number here is computed from real data, not invented — and a stat with no data behind it
// is simply not shown (no listings -> no delivery-time tile; no verified reviews -> no rating
// tile), rather than showing a zero or a placeholder. Catalog size and platform count come from
// the catalog itself, so this strip is never empty. See decision-log.md, 2026-09-21/22.
export function StatsStrip({ catalogSize, platformCount }: { catalogSize: number; platformCount: number }) {
  const { listedGames, reviews } = useStore();

  const etas = listedGames.map((g) => g.listing.deliveryEtaMinutes);
  const avgRating = reviews.length ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : null;

  const stats = [
    { value: catalogSize, suffix: "", label: "games to discover", icon: <GamepadIcon /> },
    { value: platformCount, suffix: "", label: "platforms supported", icon: <MonitorIcon /> },
    ...(etas.length > 0 ? [{ value: median(etas), suffix: " min", label: "typical delivery", icon: <ClockIcon /> }] : []),
    ...(avgRating !== null
      ? [{ value: avgRating, suffix: "★", label: `across ${reviews.length} reviews`, decimal: true, icon: <StarIcon /> }]
      : []),
  ];

  return (
    <div className="flex flex-wrap justify-center gap-4">
      {stats.map((stat, i) => (
        <m.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ delay: i * 0.1, duration: 0.5, ease: "easeOut" }}
          className="glass relative flex w-[calc(50%-0.5rem)] flex-col items-center gap-3 rounded-2xl p-6 text-center shadow-lg transition-all hover:shadow-glow-brand ring-1 ring-white/5 hover:ring-brand-500/30 sm:w-[calc(25%-0.75rem)]"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-500/10 text-brand-400">
            {stat.icon}
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="font-display text-4xl font-black text-text-primary sm:text-5xl drop-shadow-md">
              <CountUp value={stat.value} decimal={"decimal" in stat && stat.decimal} />
              <span className="text-brand-500">{stat.suffix}</span>
            </span>
            <span className="text-sm font-medium text-text-muted">{stat.label}</span>
          </div>
        </m.div>
      ))}
    </div>
  );
}

function median(nums: number[]): number {
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

// Cubic bezier easing for a smoother finish
function easeOutQuart(x: number): number {
  return 1 - Math.pow(1 - x, 4);
}

// One-time count-up when the stat scrolls into view. Plain IntersectionObserver.
function CountUp({ value, decimal }: { value: number; decimal?: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        const start = performance.now();
        const duration = 1500;
        function tick(now: number) {
          const rawProgress = Math.min((now - start) / duration, 1);
          const progress = easeOutQuart(rawProgress);
          setDisplay(value * progress);
          if (rawProgress < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
        observer.disconnect();
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [value]);

  return <span ref={ref}>{decimal ? display.toFixed(1) : Math.round(display)}</span>;
}

// Icons
function GamepadIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 11h.01M12 11h.01M16 11h.01" />
    </svg>
  );
}

function MonitorIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 21h8M12 17v4" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
      <circle cx="12" cy="12" r="10" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

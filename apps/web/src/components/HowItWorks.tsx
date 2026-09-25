import { m } from "motion/react";
import { Reveal, RevealItem } from "./Reveal";

// Reframed after direct founder feedback: the round-2/3 version explained the internal
// WhatsApp-handoff mechanism as the headline story ("message us to buy") — that puts the
// spotlight on operational plumbing instead of what the visitor actually cares about. This
// version speaks to outcomes for the gamer (explore freely, buy instantly, verified accounts,
// guaranteed) with zero mention of the fulfillment mechanism. The buy button still functionally
// opens WhatsApp (no real checkout exists yet), but that's disclosed once, briefly, right next
// to the button itself (ListingDetailPage) — not branded as a whole homepage section.
// Responsive: 1 col (phone) -> 2x2 (tablet/iPad) -> 4-in-a-row with a connector (desktop),
// instead of jumping straight from 1 to 4 columns, which left tablet widths looking stretched.
const steps = [
  { icon: <SearchIcon />, title: "Explore freely", body: "Every game, every platform — no signup required to look around." },
  { icon: <BoltIcon />, title: "Buy instantly", body: "One tap and your order is locked in — no forms, no friction." },
  { icon: <BoxIcon />, title: "Verified & prepared", body: "Every game checked and readied specifically for you." },
  { icon: <ShieldIcon />, title: "Direct support", body: "Need quick help getting set up? We are live on WhatsApp 24/7." },
];

export function HowItWorks() {
  return (
    <section className="relative flex flex-col gap-12 py-8 overflow-hidden rounded-3xl">
      <div className="absolute inset-0 bg-gradient-mesh opacity-20 pointer-events-none -z-10 mix-blend-screen" />
      <div className="absolute inset-0 bg-noise opacity-30 pointer-events-none -z-10" />

      <div className="flex flex-col items-center gap-3 text-center px-4">
        <span className="text-sm font-bold uppercase tracking-[0.2em] text-brand-400 bg-brand-500/10 px-4 py-1.5 rounded-full ring-1 ring-brand-500/20">
          What you get
        </span>
        <h2 className="font-display text-2xl font-bold text-text-primary sm:text-3xl lg:text-4xl">
          Built for gamers, not just buyers
        </h2>
      </div>

      <Reveal stagger className="relative grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8 px-4 sm:px-8">
        {/* Connector Line (Desktop) */}
        <svg
          className="pointer-events-none absolute left-0 top-12 hidden h-2 w-full lg:block z-0"
          preserveAspectRatio="none"
          aria-hidden
        >
          <line
            x1="12%"
            y1="50%"
            x2="88%"
            y2="50%"
            stroke="var(--color-border-subtle)"
            strokeWidth="2"
            strokeDasharray="8 8"
          />
          <m.line
            x1="12%"
            y1="50%"
            x2="88%"
            y2="50%"
            stroke="var(--color-brand-500)"
            strokeWidth="2"
            strokeDasharray="8 8"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            style={{ filter: "drop-shadow(0 0 8px var(--color-brand-500))" }}
          />
        </svg>

        {steps.map((step, index) => (
          <RevealItem
            key={step.title}
            className="group relative z-10 flex flex-col items-center gap-4 text-center glass p-8 rounded-2xl border border-white/5 transition-all duration-300 hover:shadow-glow-brand hover:border-brand-500/30 hover:-translate-y-1"
          >
            {/* Neon ring number */}
            <div className="absolute -top-4 -right-4 flex h-10 w-10 items-center justify-center rounded-full bg-bg-base border border-brand-500/30 text-xs font-bold text-brand-500 shadow-glow-brand group-hover:scale-110 transition-transform">
              0{index + 1}
            </div>

            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-400 shadow-[inset_0_0_20px_rgba(139,47,255,0.1)] transition-transform duration-300 group-hover:scale-110 group-hover:text-brand-300 group-hover:shadow-[inset_0_0_20px_rgba(139,47,255,0.3),_0_0_15px_rgba(139,47,255,0.5)]">
              {step.icon}
            </div>
            
            <h3 className="text-lg font-bold text-text-primary drop-shadow-sm">{step.title}</h3>
            <p className="text-sm text-text-muted leading-relaxed">{step.body}</p>
          </RevealItem>
        ))}
      </Reveal>
    </section>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-8 w-8">
      <path
        fillRule="evenodd"
        d="M9 3a6 6 0 104.47 10.03l3.75 3.75a1 1 0 001.41-1.41l-3.75-3.75A6 6 0 009 3zM5 9a4 4 0 118 0 4 4 0 01-8 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function BoltIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-8 w-8">
      <path d="M11.3 1.05a.5.5 0 01.2.6L9.9 7.5H14a.5.5 0 01.4.8l-6 9a.5.5 0 01-.9-.35l1.1-6.45H4.5a.5.5 0 01-.4-.8l6.5-8.5a.5.5 0 01.7-.15z" />
    </svg>
  );
}

function BoxIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-8 w-8">
      <path d="M10 2l7 3.5v9L10 18l-7-3.5v-9L10 2zm0 2.24L5.2 6.5 10 8.76l4.8-2.26L10 4.24zM4.5 8.2v5.1l4.5 2.25V10.4L4.5 8.2zm6.5 7.35l4.5-2.25V8.2L11 10.4v5.15z" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-8 w-8">
      <path d="M10 1.5l6.5 2.6v5c0 4.2-2.8 7.8-6.5 9-3.7-1.2-6.5-4.8-6.5-9v-5L10 1.5z" />
    </svg>
  );
}

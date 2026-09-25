import { GlowBorder } from "./GlowBorder";
import { m } from "motion/react";

// Sits directly under the homepage hero. Per iteration-2-ux-designer.md §4: trust content gets
// the same visual weight class as the primary CTA on this dark palette — never a quieter,
// lesser treatment just because it isn't the button people click. Copy compressed to tag
// fragments (founder's "less content, more graphics" note) but the specific numbers and the
// named risk ("reclaimed") are kept — that specificity is the actual trust signal, not decoration.
const items = [
  { icon: <CheckIcon />, label: "Verified digital access" },
  { icon: <ClockIcon />, label: "~15–30 min delivery" },
  { icon: <ShieldIcon />, label: "24/7 Gamer support" },
];

export function TrustStrip() {
  return (
    <div className="mx-auto max-w-3xl relative rounded-2xl">
      <GlowBorder className="p-[1px] rounded-2xl bg-trust-600/20">
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 rounded-2xl bg-bg-surface/80 backdrop-blur-md px-6 py-4 shadow-glow-trust">
          {items.map((item, i) => (
            <m.span
              key={item.label}
              whileHover={{ scale: 1.05 }}
              className="group flex cursor-default items-center gap-3 text-sm font-semibold text-trust-600 transition-all hover:text-trust-400 hover:drop-shadow-[0_0_8px_rgba(0,230,160,0.5)]"
            >
              <m.div
                initial={{ scale: 0.8, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 15,
                  delay: i * 0.15,
                }}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-trust-600/10 text-trust-500 group-hover:bg-trust-600/20"
              >
                {item.icon}
              </m.div>
              {item.label}
            </m.span>
          ))}
        </div>
      </GlowBorder>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 flex-shrink-0">
      <path
        fillRule="evenodd"
        d="M16.7 5.3a1 1 0 010 1.4l-7 7a1 1 0 01-1.4 0l-3-3a1 1 0 111.4-1.4l2.3 2.3 6.3-6.3a1 1 0 011.4 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 flex-shrink-0">
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-12a.75.75 0 00-1.5 0v4c0 .2.08.39.22.53l2.5 2.5a.75.75 0 101.06-1.06l-2.28-2.28V6z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 flex-shrink-0">
      <path d="M10 1.5l6.5 2.6v5c0 4.2-2.8 7.8-6.5 9-3.7-1.2-6.5-4.8-6.5-9v-5L10 1.5z" />
    </svg>
  );
}

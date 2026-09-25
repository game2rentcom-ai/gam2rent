import { m } from "motion/react";
import { catalog } from "../data/catalog";
import { useStore } from "../data/store";
import { Reveal } from "./Reveal";

// Verified-purchase reviews only — the store never contains anything else (the database policy
// and the query both filter on `verified`). No fabricated aggregate stat ("500+ happy customers!").
// With no reviews yet, this section simply doesn't render: an honest absence, not a placeholder.
// Per iteration-2-business-analyst.md: this niche's whole differentiation is honesty.
export function Testimonials() {
  const { reviews } = useStore();
  const featured = reviews
    .filter((review) => review.rating >= 4)
    .map((review) => ({ ...review, gameTitle: catalog.find((g) => g.id === review.gameId)?.title }))
    .filter((review): review is typeof review & { gameTitle: string } => review.gameTitle !== undefined)
    .slice(0, 4);

  if (featured.length === 0) return null;

  // Duplicate items for seamless continuous marquee loop
  const marqueeItems = [...featured, ...featured];

  return (
    <section className="flex flex-col gap-10 overflow-hidden py-4">
      <div className="flex flex-col items-center gap-3 text-center px-4">
        <span className="text-sm font-bold uppercase tracking-[0.2em] text-brand-400 bg-brand-500/10 px-4 py-1.5 rounded-full ring-1 ring-brand-500/20">
          Real buyers
        </span>
        <h2 className="font-display text-2xl font-bold text-text-primary sm:text-3xl lg:text-4xl">
          Verified purchases, not marketing copy
        </h2>
      </div>

      <Reveal variant="fade-up" className="relative w-full -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="pointer-events-none absolute bottom-0 left-0 top-0 z-10 w-16 sm:w-32 bg-gradient-to-r from-bg-base to-transparent" />
        <div className="pointer-events-none absolute bottom-0 right-0 top-0 z-10 w-16 sm:w-32 bg-gradient-to-l from-bg-base to-transparent" />

        <div className="group flex overflow-hidden">
          <m.div
            className="flex gap-6 pr-6 w-max"
            animate={{ x: ["0%", "-50%"] }}
            transition={{
              duration: 30,
              ease: "linear",
              repeat: Infinity,
            }}
            whileHover={{ animationPlayState: "paused" }}
          >
            {marqueeItems.map((review, i) => (
              <div
                key={`${review.id}-${i}`}
                className="glass-sm flex w-72 flex-col gap-4 rounded-2xl p-6 border border-white/5 hover:border-brand-500/20 hover:shadow-glow-brand transition-all flex-shrink-0"
              >
                <div className="flex items-center gap-3">
                  {/* Avatar Placeholder */}
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-bg-surface border border-border-subtle text-sm font-bold text-text-primary shadow-inner">
                    {review.id.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="trust-pill text-[10px] self-start px-2 py-0.5">Verified purchase</span>
                    <div className="flex text-xs">
                      {[1, 2, 3, 4, 5].map((star, index) => (
                        <m.span
                          key={star}
                          initial={{ color: "var(--color-text-muted)" }}
                          whileInView={{
                            color: star <= review.rating ? "var(--color-rating-gold)" : "var(--color-text-muted)",
                          }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.1 * index, duration: 0.3 }}
                          className="drop-shadow-sm"
                        >
                          ★
                        </m.span>
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-sm text-text-primary italic leading-relaxed">"{review.comment}"</p>
                <p className="mt-auto text-xs font-semibold text-brand-400">— {review.gameTitle} buyer</p>
              </div>
            ))}
          </m.div>
        </div>
      </Reveal>
    </section>
  );
}

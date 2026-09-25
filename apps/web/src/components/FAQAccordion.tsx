import { useState } from "react";
import { m, AnimatePresence } from "motion/react";

export interface FAQItem {
  q: string;
  a: string;
}

interface FAQAccordionProps {
  items: FAQItem[];
  title?: string;
  subtitle?: string;
}

export function FAQAccordion({ items, title, subtitle }: FAQAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <div className="flex flex-col gap-6">
      {(title || subtitle) && (
        <div className="flex flex-col gap-1.5 text-center max-w-xl mx-auto">
          {subtitle && (
            <span className="text-xs font-bold uppercase tracking-wider text-brand-500">
              {subtitle}
            </span>
          )}
          {title && (
            <h2 className="font-display text-2xl sm:text-3xl font-black text-white">
              {title}
            </h2>
          )}
        </div>
      )}

      <div className="flex flex-col gap-3 max-w-3xl mx-auto w-full">
        {items.map((item, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                isOpen
                  ? "bg-bg-surface-raised border-brand-500/40 shadow-glow-brand"
                  : "bg-bg-surface/70 border-white/10 hover:border-white/20"
              }`}
            >
              <button
                type="button"
                onClick={() => toggle(idx)}
                aria-expanded={isOpen}
                className="w-full flex items-center justify-between gap-4 p-5 text-left focus:outline-none"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`h-2 w-2 rounded-full transition-colors ${
                      isOpen ? "bg-brand-500 shadow-glow-brand" : "bg-white/30"
                    }`}
                  />
                  <span className="font-display text-sm sm:text-base font-bold text-white">
                    {item.q}
                  </span>
                </div>
                <div
                  className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center border transition-transform duration-300 ${
                    isOpen
                      ? "rotate-180 border-brand-500 bg-brand-500/20 text-brand-100"
                      : "border-white/15 bg-white/5 text-text-muted"
                  }`}
                >
                  <svg className="w-3.5 h-3.5 fill-none viewBox=0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <m.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                  >
                    <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-text-muted leading-relaxed border-t border-white/5 pl-10">
                      {item.a}
                    </div>
                  </m.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}

import type { ReactNode } from "react";
import type { Variants } from "motion/react";
import { m } from "motion/react";

type RevealVariant = "fade-up" | "fade-down" | "slide-left" | "slide-right" | "scale" | "blur";

const variantMap: Record<RevealVariant, Variants> = {
  "fade-up": {
    hidden: { opacity: 0, y: 24 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  },
  "fade-down": {
    hidden: { opacity: 0, y: -24 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  },
  "slide-left": {
    hidden: { opacity: 0, x: -40 },
    show: { opacity: 1, x: 0, transition: { duration: 0.6, ease: "easeOut" } },
  },
  "slide-right": {
    hidden: { opacity: 0, x: 40 },
    show: { opacity: 1, x: 0, transition: { duration: 0.6, ease: "easeOut" } },
  },
  scale: {
    hidden: { opacity: 0, scale: 0.9 },
    show: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: "easeOut" } },
  },
  blur: {
    hidden: { opacity: 0, filter: "blur(8px)" },
    show: { opacity: 1, filter: "blur(0px)", transition: { duration: 0.6, ease: "easeOut" } },
  },
};

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};


export function Reveal({ children, stagger = false, variant = "fade-up", className = "", delay = 0 }: {
  children: ReactNode;
  stagger?: boolean;
  variant?: RevealVariant;
  className?: string;
  delay?: number;
}) {
  const v = variantMap[variant];
  return (
    <m.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.15 }}
      variants={stagger ? container : v}
      transition={delay ? { delay } : undefined}
    >
      {children}
    </m.div>
  );
}

export function RevealItem({ children, className = "", variant = "fade-up" }: {
  children: ReactNode;
  className?: string;
  variant?: RevealVariant;
}) {
  return (
    <m.div className={className} variants={variantMap[variant]}>
      {children}
    </m.div>
  );
}

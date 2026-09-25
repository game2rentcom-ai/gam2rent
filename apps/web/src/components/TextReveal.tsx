import { m, LazyMotion, domAnimation } from 'motion/react';

interface TextRevealProps {
  text: string;
  className?: string;
  mode?: 'word' | 'char';
  delay?: number;
  stagger?: number;
}

export function TextReveal({
  text,
  className = '',
  mode = 'word',
  delay = 0,
  stagger = 0.05,
}: TextRevealProps) {
  const elements = mode === 'word' ? text.split(' ') : text.split('');

  return (
    <LazyMotion features={domAnimation}>
      <m.div
        className={className}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        transition={{ staggerChildren: stagger, delayChildren: delay }}
      >
        {elements.map((element, i) => (
          <m.span
            key={i}
            className="inline-block"
            style={{ marginRight: mode === 'word' ? '0.25em' : '0' }}
            variants={{
              hidden: { opacity: 0, y: 20, filter: 'blur(4px)' },
              visible: { opacity: 1, y: 0, filter: 'blur(0px)' },
            }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            {element === ' ' ? '\u00A0' : element}
          </m.span>
        ))}
      </m.div>
    </LazyMotion>
  );
}

export function GlitchText({ text, className = '' }: { text: string; className?: string }) {
  return (
    <span className={`relative inline-block group ${className}`}>
      <span className="relative z-10">{text}</span>
      <span className="absolute inset-0 z-0 hidden group-hover:block animate-pulse text-[var(--color-brand-500)]" style={{ transform: 'translate(2px, 2px)', opacity: 0.7 }}>{text}</span>
      <span className="absolute inset-0 z-0 hidden group-hover:block animate-pulse text-[var(--color-accent-400)]" style={{ transform: 'translate(-2px, -2px)', opacity: 0.7, animationDelay: '50ms' }}>{text}</span>
    </span>
  );
}

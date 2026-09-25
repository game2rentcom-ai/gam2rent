import { m, useScroll, useSpring, LazyMotion, domAnimation } from 'motion/react';

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <LazyMotion features={domAnimation}>
      <m.div
        className="fixed top-0 left-0 right-0 z-50 h-[3px]"
        style={{
          scaleX,
          transformOrigin: '0%',
          background: 'linear-gradient(to right, var(--color-brand-500), var(--color-accent-400))',
        }}
      />
    </LazyMotion>
  );
}

import { useMemo, useEffect, useState } from 'react';

interface ParticleBackgroundProps {
  className?: string;
  particleCount?: number;
}

export function ParticleBackground({
  className = '',
  particleCount = 30,
}: ParticleBackgroundProps) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const particles = useMemo(() => {
    return Array.from({ length: particleCount }).map((_, i) => {
      const size = Math.random() * 2 + 2; // 2-4px
      const duration = Math.random() * 12 + 8; // 8-20s
      const left = Math.random() * 100;
      const delay = Math.random() * -20;
      const opacity = Math.random() * 0.3 + 0.3; // 30-60%
      const isBrand = Math.random() > 0.5;
      
      return {
        id: i,
        size,
        duration,
        left,
        delay,
        opacity,
        backgroundColor: isBrand ? 'var(--color-brand-500)' : 'var(--color-accent-400)',
      };
    });
  }, [particleCount]);

  if (prefersReducedMotion) return null;

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute bottom-0 rounded-full animate-[float_10s_linear_infinite]"
          style={{
            width: `${p.size}px`,
            height: `${p.size}px`,
            left: `${p.left}%`,
            opacity: p.opacity,
            backgroundColor: p.backgroundColor,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            boxShadow: `0 0 ${p.size * 2}px ${p.backgroundColor}`,
          }}
        />
      ))}
      <style suppressHydrationWarning>{`
        @keyframes float {
          0% {
            transform: translateY(10px) translateX(0px);
            opacity: 0;
          }
          10% {
            opacity: var(--tw-particle-opacity, 0.5);
          }
          90% {
            opacity: var(--tw-particle-opacity, 0.5);
          }
          100% {
            transform: translateY(-100vh) translateX(20px);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

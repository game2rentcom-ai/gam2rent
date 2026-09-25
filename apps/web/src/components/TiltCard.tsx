import React, { useRef, useState, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  glareEnabled?: boolean;
  tiltMaxX?: number;
  tiltMaxY?: number;
}

export function TiltCard({
  children,
  className = '',
  glareEnabled = false,
  tiltMaxX = 8,
  tiltMaxY = 8,
}: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState({});
  const [glareStyle, setGlareStyle] = useState({});
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (prefersReducedMotion || !cardRef.current) return;

      const rect = cardRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const xPct = (x / rect.width - 0.5) * 2;
      const yPct = (y / rect.height - 0.5) * 2;

      const rotateX = -yPct * tiltMaxX;
      const rotateY = xPct * tiltMaxY;

      setStyle({
        transform: `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
        transition: 'transform 0.15s ease-out',
      });

      if (glareEnabled) {
        setGlareStyle({
          background: `radial-gradient(circle at ${x}px ${y}px, rgba(255, 255, 255, 0.15), transparent 60%)`,
          opacity: 1,
        });
      }
    },
    [glareEnabled, prefersReducedMotion, tiltMaxX, tiltMaxY]
  );

  const handleMouseLeave = useCallback(() => {
    if (prefersReducedMotion) return;

    setStyle({
      transform: 'perspective(800px) rotateX(0deg) rotateY(0deg)',
      transition: 'transform 0.4s ease-out',
    });

    if (glareEnabled) {
      setGlareStyle({
        opacity: 0,
      });
    }
  }, [glareEnabled, prefersReducedMotion]);

  return (
    <div
      ref={cardRef}
      className={`relative overflow-hidden ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        ...style,
        willChange: 'transform',
      }}
    >
      {children}
      {glareEnabled && (
        <div
          className="pointer-events-none absolute inset-0 transition-opacity duration-300"
          style={glareStyle}
        />
      )}
    </div>
  );
}

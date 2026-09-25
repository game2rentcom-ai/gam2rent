import { useEffect, useRef, useState } from 'react';

export function MouseGlow() {
  const glowRef = useRef<HTMLDivElement>(null);
  const [isFinePointer, setIsFinePointer] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(pointer: fine)');
    setIsFinePointer(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setIsFinePointer(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (!isFinePointer || !glowRef.current) return;

    let rafId: number;
    let targetX = 0;
    let targetY = 0;

    const onMouseMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
    };

    const updateGlow = () => {
      if (glowRef.current) {
        glowRef.current.style.transform = `translate(${targetX}px, ${targetY}px) translate(-50%, -50%)`;
      }
      rafId = requestAnimationFrame(updateGlow);
    };

    window.addEventListener('mousemove', onMouseMove);
    rafId = requestAnimationFrame(updateGlow);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      cancelAnimationFrame(rafId);
    };
  }, [isFinePointer]);

  if (!isFinePointer) return null;

  return (
    <div
      ref={glowRef}
      className="pointer-events-none fixed left-0 top-0 z-0 h-[800px] w-[800px]"
      style={{
        background: 'radial-gradient(circle, rgba(139, 47, 255, 0.08) 0%, transparent 50%)',
        willChange: 'transform',
      }}
    />
  );
}

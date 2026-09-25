import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import Lenis from 'lenis';

interface ScrollContextType {
  lenis: Lenis | null;
  scrollProgress: number;
}

const ScrollContext = createContext<ScrollContextType>({
  lenis: null,
  scrollProgress: 0,
});

export function useScrollContext() {
  return useContext(ScrollContext);
}

interface SmoothScrollProps {
  children: ReactNode;
}

export function SmoothScroll({ children }: SmoothScrollProps) {
  const [lenis, setLenis] = useState<Lenis | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const lenisInstance = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      touchMultiplier: 2,
    });

    setLenis(lenisInstance);

    let rafId: number;

    const raf = (time: number) => {
      lenisInstance.raf(time);
      rafId = requestAnimationFrame(raf);
    };

    rafId = requestAnimationFrame(raf);

    lenisInstance.on('scroll', (e: any) => {
      setScrollProgress(e.progress);
    });

    return () => {
      lenisInstance.destroy();
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <ScrollContext.Provider value={{ lenis, scrollProgress }}>
      {children}
    </ScrollContext.Provider>
  );
}

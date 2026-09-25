import type { ReactNode } from 'react';

export interface GlowBorderProps {
  children?: ReactNode;
  className?: string;
  borderWidth?: number;
  glowColor?: string;
}

export function GlowBorder({
  children,
  className = '',
  borderWidth = 2,
  glowColor = 'var(--color-brand-500)',
}: GlowBorderProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl ${className}`}
      style={{ padding: borderWidth }}
    >
      <div
        className="absolute inset-0 z-0 animate-[spin_3s_linear_infinite]"
        style={{
          background: `conic-gradient(from 0deg, transparent 50%, ${glowColor} 80%, transparent 100%)`,
          width: '200%',
          height: '200%',
          top: '-50%',
          left: '-50%',
        }}
      />
      <div className="relative z-10 h-full w-full rounded-[calc(0.75rem-2px)] bg-[var(--color-bg-surface)]">
        {children}
      </div>
    </div>
  );
}

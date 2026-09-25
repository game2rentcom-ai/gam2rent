import type { ButtonHTMLAttributes, ReactNode } from "react";
import { soundFx } from "../utils/soundEffects";

type Variant = "primary" | "secondary" | "ghost";
type Size = "default" | "lg" | "sm";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  glow?: boolean;
  children: ReactNode;
}

const base =
  "relative inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-300 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 overflow-hidden";

const sizes: Record<Size, string> = {
  sm: "px-4 py-2 text-xs",
  default: "px-6 py-3 text-sm",
  lg: "px-8 py-4 text-base",
};

const variants: Record<Variant, string> = {
  primary:
    "bg-brand-500 text-white hover:bg-brand-600 hover:shadow-glow-brand-lg hover:scale-[1.02]",
  secondary:
    "bg-transparent text-text-primary border border-border-subtle hover:border-brand-500 hover:text-brand-500 hover:shadow-glow-brand hover:scale-[1.02]",
  ghost:
    "bg-transparent text-text-muted hover:text-text-primary hover:bg-white/5",
};

export function Button({
  variant = "primary",
  size = "default",
  glow = false,
  className = "",
  children,
  onClick,
  onMouseEnter,
  ...rest
}: ButtonProps) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!rest.disabled) {
      soundFx.playClick();
    }
    onClick?.(e);
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!rest.disabled) {
      soundFx.playHover();
    }
    onMouseEnter?.(e);
  };

  return (
    <button
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      className={`${base} ${sizes[size]} ${variants[variant]} ${glow ? "animate-btn-glow" : ""} ${className}`}
      {...rest}
    >
      {/* Shimmer overlay for primary buttons */}
      {variant === "primary" && !rest.disabled && (
        <span className="pointer-events-none absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      )}
      {children}
    </button>
  );
}

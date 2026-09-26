import { IconStar } from "./icons";

// Five stars, filled to the real average (4.5 fills four and a half). Decorative: the number next to it,
// or an aria-label on the wrapper, says the rating in words.
export function Stars({ value, className = "h-4 w-4" }: { value: number; className?: string }) {
  const row = (tone: string) => (
    <span className={`flex gap-0.5 ${tone}`}>
      {[0, 1, 2, 3, 4].map((i) => <IconStar key={i} className={`shrink-0 ${className}`} />)}
    </span>
  );
  return (
    <span className="relative inline-flex" aria-hidden="true">
      {row("text-white/20")}
      <span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${Math.max(0, Math.min(5, value)) * 20}%` }}>
        {row("text-rating-gold")}
      </span>
    </span>
  );
}

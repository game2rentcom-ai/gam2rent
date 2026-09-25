import { useEffect, useRef } from "react";
import { IconClose } from "./icons";

// A bottom sheet on phones, a centred dialog on larger screens. Closes on the backdrop, the close
// button and Escape; locks page scroll while open; returns focus to whatever opened it.
interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** "full" fills the phone screen from the top — for anything with a text field, so the on-screen
   * keyboard can't cover it. Default is a bottom sheet. */
  variant?: "bottom" | "full";
}

export function Sheet({ open, onClose, title, children, footer, variant = "bottom" }: Props) {
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const scrollY = window.scrollY;
    document.body.style.overflow = "hidden";
    panel.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
      window.scrollTo(0, scrollY);
      previous?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className={`fixed inset-0 z-[70] flex justify-center ${variant === "full" ? "items-stretch sm:items-start sm:pt-24" : "items-end sm:items-center"}`} role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" aria-label="Close" className="absolute inset-0 bg-black/70" onClick={onClose} tabIndex={-1} />
      <div
        ref={panel}
        tabIndex={-1}
        className={`relative flex w-full flex-col border-white/10 bg-bg-surface shadow-2xl outline-none sm:max-w-lg sm:rounded-3xl sm:border ${
          variant === "full" ? "h-dvh sm:h-auto sm:max-h-[80dvh]" : "max-h-[88dvh] rounded-t-3xl border"
        }`}
      >
        <div className="flex items-center justify-between px-5 pb-2 pt-4">
          <h2 className="font-display text-lg font-bold text-text-primary">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="-mr-2 flex h-11 w-11 items-center justify-center rounded-full text-text-muted hover:bg-white/5 hover:text-text-primary">
            <IconClose />
          </button>
        </div>
        <div className="overflow-y-auto overscroll-contain px-5 pb-4">{children}</div>
        {footer && <div className="border-t border-white/10 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">{footer}</div>}
      </div>
    </div>
  );
}

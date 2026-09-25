import { useEffect } from "react";
import { m, AnimatePresence } from "motion/react";
import { soundFx } from "../utils/soundEffects";

interface TrailerModalProps {
  isOpen: boolean;
  onClose: () => void;
  youtubeId: string | null;
  title: string;
}

export function TrailerModal({ isOpen, onClose, youtubeId, title }: TrailerModalProps) {
  useEffect(() => {
    if (isOpen) {
      soundFx.playModalOpen();
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          onClose();
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
      return () => {
        window.removeEventListener("keydown", handleKeyDown);
        document.body.style.overflow = "";
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen || !youtubeId) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-10">
        {/* Backdrop */}
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => {
            soundFx.playClick();
            onClose();
          }}
          className="absolute inset-0 bg-black/90 backdrop-blur-xl"
        />

        {/* Modal Window */}
        <m.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="relative w-full max-w-5xl rounded-3xl border border-white/20 bg-bg-surface-raised/95 shadow-2xl overflow-hidden z-10 flex flex-col"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-bg-surface">
            <div className="flex items-center gap-3">
              <span className="flex h-3 w-3 items-center justify-center rounded-full bg-red-500 animate-pulse">
                <span className="h-1.5 w-1.5 rounded-full bg-white" />
              </span>
              <div>
                <h3 className="font-display text-sm sm:text-base font-bold text-white truncate max-w-md sm:max-w-lg">
                  {title}
                </h3>
                <span className="text-[11px] text-text-muted uppercase font-bold tracking-wider">
                  Official Gameplay Trailer · 4K UHD
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                soundFx.playClick();
                onClose();
              }}
              className="rounded-full p-2 text-text-muted hover:text-white hover:bg-white/10 transition-colors border border-white/10"
              aria-label="Close Trailer Modal"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 16:9 Video Container */}
          <div className="relative w-full pt-[56.25%] bg-black">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
              title={title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="absolute inset-0 w-full h-full border-0"
            />
          </div>

          {/* Footer Bar */}
          <div className="flex items-center justify-between px-6 py-3 border-t border-white/10 bg-bg-surface text-xs text-text-muted">
            <span>Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-white text-[10px]">ESC</kbd> or click outside to close</span>
            <span className="text-trust-600 font-semibold flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-trust-600" /> Available to Rent & Buy on GameBuy
            </span>
          </div>
        </m.div>
      </div>
    </AnimatePresence>
  );
}

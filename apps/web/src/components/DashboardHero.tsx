import { m, AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "./Button";
import { getGameImage, placeholderColor } from "../data/gameImages";
import type { CatalogGame } from "../data/catalogTypes";
import { PLATFORM_LABEL } from "../data/catalogTypes";
import { useStore } from "../data/store";
import { whatsAppLink } from "../config";
import { getGameTrailer } from "../data/gameTrailers";
import { TrailerModal } from "./TrailerModal";
import { soundFx } from "../utils/soundEffects";

interface DashboardHeroProps {
  slides: CatalogGame[];
}

export function DashboardHero({ slides }: DashboardHeroProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [trailerOpen, setTrailerOpen] = useState(false);
  const { findListedGame } = useStore();

  useEffect(() => {
    if (slides.length <= 1 || isPaused) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        soundFx.playWarp();
        return (prev + 1) % slides.length;
      });
    }, 6000);
    return () => clearInterval(interval);
  }, [slides.length, isPaused]);

  if (!slides || slides.length === 0) return null;

  const currentSlide = slides[currentIndex];
  const { hero } = getGameImage(currentSlide.id);
  const bgColor = placeholderColor(currentSlide.id);
  const listed = findListedGame(currentSlide.id);
  // Only a real listing has a price; nothing is invented (rental prices come from the admin panel later).
  const buyPrice = listed?.listing.price;
  const trailer = getGameTrailer(currentSlide.id);

  const buyLink = whatsAppLink(
    buyPrice !== undefined
      ? `Hi! I want to BUY "${currentSlide.title}" (₹${buyPrice}). Is delivery ready?`
      : `Hi! Is "${currentSlide.title}" available to buy?`
  );
  const rentLink = whatsAppLink(
    `Hi! I want to RENT "${currentSlide.title}". What's the price and delivery time?`
  );

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative w-full rounded-3xl overflow-hidden border border-white/10 shadow-2xl group flex flex-col justify-between p-6 sm:p-8 lg:p-10 min-h-[460px] lg:min-h-[500px] gap-6"
      style={{ backgroundColor: bgColor }}
    >
      {/* Background Hero Wallpaper with cinematic Ken Burns & crossfade */}
      <AnimatePresence mode="popLayout">
        <m.div
          key={currentSlide.id}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="absolute inset-0 z-0"
        >
          <img
            src={hero}
            alt={currentSlide.title}
            onError={(e) => {
              const target = e.currentTarget;
              const { cover } = getGameImage(currentSlide.id);
              if (target.src !== cover) {
                target.src = cover;
              }
            }}
            className="w-full h-full object-cover object-center"
          />
        </m.div>
      </AnimatePresence>

      {/* Cyber gradient atmospheric overlays — at z-[1] so they sit directly on top of the image */}
      <div className="absolute inset-0 bg-gradient-to-t from-bg-base via-bg-base/50 to-black/25 pointer-events-none z-[1]" />
      <div className="absolute inset-0 bg-gradient-to-r from-bg-base/95 via-bg-base/60 to-transparent pointer-events-none z-[1]" />

      {/* Top Bar: Spotlight Pill + Platform details */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-500/50 bg-brand-500/25 px-3.5 py-1 text-xs font-black tracking-wider text-brand-100 backdrop-blur-md">
            <span className="h-2 w-2 rounded-full bg-brand-400 animate-pulse" />
            SPOTLIGHT TITLE
          </span>
          <span className="rounded-full border border-trust-300 bg-trust-100 px-3 py-1 text-xs font-bold text-trust-600 backdrop-blur-md">
            ⚡ Instant Access · ~15–30m
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-white/10 bg-black/50 px-3 py-1 text-xs text-text-muted backdrop-blur-md">
          <span>🛡️ Verified Digital Access</span>
        </div>
      </div>

      {/* Center Info: Title, Description, and Rent/Buy CTA Buttons */}
      <div className="relative z-10 max-w-2xl flex flex-col gap-4">
        <AnimatePresence mode="wait">
          <m.div
            key={currentSlide.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35 }}
            className="flex flex-col gap-3"
          >
            {/* Platform and genre pills */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md border border-white/20 bg-black/60 px-2.5 py-0.5 text-xs font-bold text-white">
                {currentSlide.genre}
              </span>
              {currentSlide.platforms.slice(0, 3).map((p) => (
                <span
                  key={p}
                  className="rounded-md border border-white/10 bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-text-muted uppercase"
                >
                  {PLATFORM_LABEL[p]}
                </span>
              ))}
            </div>

            {/* Game Title */}
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight drop-shadow-md">
              {currentSlide.title}
            </h2>

            {/* Description */}
            <p className="text-sm sm:text-base text-text-muted line-clamp-2 max-w-xl leading-relaxed">
              {currentSlide.description}
            </p>

            {/* Dual Pricing & Action Buttons */}
            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              {/* Buy Button */}
              <a href={buyLink} target="_blank" rel="noreferrer">
                <Button variant="primary" size="lg" glow className="px-6 py-3 text-sm sm:text-base">
                  <span>{buyPrice !== undefined ? "Buy to Own" : "Check Availability"}</span>
                  {buyPrice !== undefined && (
                    <span className="ml-1.5 font-display font-black text-white">
                      ₹{buyPrice.toLocaleString("en-IN")}
                    </span>
                  )}
                </Button>
              </a>

              {/* Rent Button */}
              <a href={rentLink} target="_blank" rel="noreferrer">
                <Button
                  variant="secondary"
                  size="lg"
                  className="border-trust-600/50 text-trust-600 hover:border-trust-600 hover:text-white hover:bg-trust-600/20 px-6 py-3 text-sm sm:text-base"
                >
                  <span>Rent this Game</span>
                </Button>
              </a>

              {/* 4K Trailer Preview Button */}
              {trailer && (
                <button
                  type="button"
                  onClick={() => {
                    soundFx.playClick();
                    setTrailerOpen(true);
                  }}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold text-white backdrop-blur-md hover:bg-white/20 hover:border-brand-500 hover:shadow-glow-brand transition-all group"
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow-md group-hover:scale-110 transition-transform">
                    <svg className="w-2.5 h-2.5 fill-current ml-0.5" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </span>
                  <span>Watch 4K Trailer</span>
                </button>
              )}

              {/* Direct Link to Details */}
              <Link
                to={`/games/${currentSlide.id}`}
                className="text-xs font-bold text-text-muted hover:text-brand-100 transition-colors py-2"
              >
                Game Details & Reviews →
              </Link>
            </div>
          </m.div>
        </AnimatePresence>
      </div>

      {/* Bottom Thumbnail Selector Bar */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-white/10">
        <span className="text-xs font-bold text-text-muted uppercase tracking-wider">
          Featured Lineup
        </span>

        <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-1">
          {slides.map((slide, idx) => {
            const isActive = idx === currentIndex;
            const { cover: thumbCover } = getGameImage(slide.id);
            return (
              <button
                key={slide.id}
                onClick={() => {
                  soundFx.playWarp();
                  setCurrentIndex(idx);
                }}
                className={`group/thumb relative flex items-center gap-2 rounded-xl border p-1.5 transition-all duration-300 text-left ${
                  isActive
                    ? "border-brand-500 bg-brand-500/25 shadow-glow-brand scale-105"
                    : "border-white/10 bg-black/50 opacity-70 hover:opacity-100 hover:border-white/30"
                }`}
              >
                <img
                  src={thumbCover}
                  alt={slide.title}
                  className="h-10 w-8 sm:h-11 sm:w-9 rounded-lg object-cover"
                />
                <div className="hidden md:flex flex-col text-left pr-2">
                  <span className="line-clamp-1 text-xs font-bold text-white max-w-[110px]">
                    {slide.title}
                  </span>
                  <span className="text-[10px] text-trust-600 font-semibold">
                    Rent or Buy
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Slide Countdown Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
        <m.div
          key={currentIndex}
          initial={{ width: "0%" }}
          animate={{ width: isPaused ? "0%" : "100%" }}
          transition={{ duration: 6, ease: "linear" }}
          className="h-full bg-gradient-to-r from-brand-500 to-accent-400"
        />
      </div>

      {/* Trailer Modal */}
      <TrailerModal
        isOpen={trailerOpen}
        onClose={() => setTrailerOpen(false)}
        youtubeId={trailer?.youtubeId || null}
        title={currentSlide.title}
      />
    </div>
  );
}

export function DashboardHeroSkeleton() {
  return (
    <div className="h-[500px] lg:h-[540px] animate-pulse rounded-3xl bg-bg-surface border border-white/5" />
  );
}

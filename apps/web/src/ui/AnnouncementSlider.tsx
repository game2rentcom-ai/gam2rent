import { useEffect, useRef, useState } from "react";
import { useStore } from "../data/store";
import { isLive, type Announcement } from "../types/announcement";
import { Button } from "./Button";

// The home page's moving banner: new games ("GTA 6 is coming") and offers, set up in Admin → Announcements.
// Slides advance on their own and pause while the visitor points at, touches or tabs into them; arrows,
// dots and swiping work too. Hidden slides are inert so the keyboard only reaches the visible one.
const SLIDE_MS = 6000;

function useNow(everyMs: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), everyMs);
    return () => clearInterval(t);
  }, [everyMs]);
  return now;
}

function Countdown({ to, now }: { to: number; now: number }) {
  const left = Math.max(0, to - now);
  if (left === 0) return null;
  const parts: [number, string][] = [
    [Math.floor(left / 86_400_000), "days"],
    [Math.floor(left / 3_600_000) % 24, "hrs"],
    [Math.floor(left / 60_000) % 60, "min"],
    [Math.floor(left / 1000) % 60, "sec"],
  ];
  return (
    <div className="flex gap-2" role="timer" aria-label={`${parts[0][0]} days ${parts[1][0]} hours ${parts[2][0]} minutes left`}>
      {parts.map(([n, unit]) => (
        <div key={unit} className="flex min-w-14 flex-col items-center rounded-lg border border-accent-400/40 bg-black/45 px-2 py-1.5 backdrop-blur-sm">
          <span className="font-display text-xl font-bold tabular-nums leading-none text-text-primary sm:text-2xl">{String(n).padStart(2, "0")}</span>
          <span className="mt-1 text-xs font-semibold uppercase tracking-wide text-accent-300">{unit}</span>
        </div>
      ))}
    </div>
  );
}

function Slide({ slide, active, now, first }: { slide: Announcement; active: boolean; now: number; first: boolean }) {
  return (
    <div className="relative flex min-h-56 min-w-full items-end overflow-hidden sm:min-h-72">
      {slide.imageUrl ? (
        <img src={slide.imageUrl} alt="" loading={first ? "eager" : "lazy"} className={`absolute inset-0 h-full w-full object-cover transition-transform duration-[6000ms] ease-out ${active ? "scale-105" : "scale-100"}`} />
      ) : (
        <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(60%_90%_at_10%_100%,color-mix(in_srgb,var(--color-brand-400)_45%,transparent),transparent_70%),radial-gradient(50%_80%_at_95%_0%,color-mix(in_srgb,var(--color-accent-400)_40%,transparent),transparent_70%)] bg-bg-surface-raised" />
      )}
      <div aria-hidden="true" className="absolute inset-0 bg-linear-to-t from-bg-base via-bg-base/60 to-transparent sm:bg-linear-to-r sm:from-bg-base/95 sm:via-bg-base/55" />
      {active && (
        <div key={slide.id} className="slide-rise relative flex max-w-xl flex-col items-start gap-3 p-5 sm:px-16 sm:py-8">
          <h2 className="font-display text-2xl font-bold leading-tight text-text-primary sm:text-4xl">{slide.title}</h2>
          {slide.subtitle && <p className="text-sm text-text-muted sm:text-base">{slide.subtitle}</p>}
          {slide.countdownTo !== undefined && <Countdown to={slide.countdownTo} now={now} />}
          {slide.button && (
            slide.button.href.startsWith("/")
              ? <Button to={slide.button.href}>{slide.button.label}</Button>
              : <Button href={slide.button.href}>{slide.button.label}</Button>
          )}
        </div>
      )}
    </div>
  );
}

export function AnnouncementSlider({ className = "" }: { className?: string }) {
  const { announcements } = useStore();
  const now = useNow(1000);
  const slides = announcements.filter((a) => isLive(a, now));
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);
  const count = slides.length;
  const current = count ? index % count : 0;

  useEffect(() => {
    if (count < 2 || paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setTimeout(() => setIndex((i) => (i + 1) % count), SLIDE_MS);
    return () => clearTimeout(t);
  }, [count, paused, current]);

  if (count === 0) return null;
  const go = (i: number) => setIndex((i + count) % count);

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Announcements"
      className={`frame relative overflow-hidden rounded-2xl ${className}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onTouchStart={(e) => { touchX.current = e.touches[0]!.clientX; setPaused(true); }}
      onTouchEnd={(e) => {
        const dx = e.changedTouches[0]!.clientX - (touchX.current ?? e.changedTouches[0]!.clientX);
        if (Math.abs(dx) > 40) go(current + (dx < 0 ? 1 : -1));
        touchX.current = null;
        setPaused(false);
      }}
    >
      <div className="flex transition-transform duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)]" style={{ transform: `translateX(-${current * 100}%)` }}>
        {slides.map((s, i) => (
          <div key={s.id} role="group" aria-roledescription="slide" aria-label={`${i + 1} of ${count}: ${s.title}`} aria-hidden={i !== current} inert={i !== current} className="min-w-full">
            <Slide slide={s} active={i === current} now={now} first={i === 0} />
          </div>
        ))}
      </div>

      {count > 1 && (
        <>
          <button type="button" onClick={() => go(current - 1)} aria-label="Previous announcement" className="absolute left-2 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-xl text-text-primary backdrop-blur-sm hover:bg-black/70 sm:flex">‹</button>
          <button type="button" onClick={() => go(current + 1)} aria-label="Next announcement" className="absolute right-2 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-xl text-text-primary backdrop-blur-sm hover:bg-black/70 sm:flex">›</button>
          <div className="absolute bottom-0 right-2 flex">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => go(i)}
                aria-label={`Show announcement ${i + 1}`}
                aria-current={i === current}
                className="flex h-11 min-w-11 items-center justify-center"
              >
                {/* The visible dot is small; the button around it is a full-size tap target. */}
                <span className={`relative h-2 overflow-hidden rounded-full bg-white/25 transition-[width] duration-300 ${i === current ? "w-8" : "w-2"}`}>
                  {i === current && (
                    <span
                      key={`${current}-${paused}`}
                      className="absolute inset-0 origin-left bg-accent-400"
                      style={{ animation: paused ? "none" : `slide-progress ${SLIDE_MS}ms linear both`, transform: paused ? "scaleX(1)" : undefined }}
                    />
                  )}
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

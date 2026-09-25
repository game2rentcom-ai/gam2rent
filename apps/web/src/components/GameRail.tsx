import { useRef } from "react";
import { Link } from "react-router-dom";
import { CatalogCard } from "./CatalogCard";
import { ListingCard } from "./ListingCard";
import { catalog } from "../data/catalog";
import { useStore } from "../data/store";
import { Reveal, RevealItem } from "./Reveal";

// A horizontally-scrolling rail of catalog titles by id — used for "New Releases," "Popular,"
// etc. on the homepage and "More Like This" on game pages. Each id resolves to a ListingCard (if
// it currently has a listing) or a CatalogCard (if not) — same honest split as BrowsePage.
// While the database is still answering, placeholders hold the space so cards don't visibly swap
// type and shift the layout when prices arrive.
export function GameRail({ title, ids }: { title: string; ids: string[] }) {
  const { status, findListedGame } = useStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const games = ids.map((id) => catalog.find((g) => g.id === id)).filter((g) => g !== undefined);
  if (games.length === 0) return null;

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { current } = scrollRef;
      const scrollAmount = direction === 'left' ? -current.offsetWidth + 100 : current.offsetWidth - 100;
      current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-text-primary sm:text-xl">{title}</h2>
        <Link to="/browse" className="text-sm font-semibold text-brand-500 hover:text-brand-400 transition-colors">
          See all →
        </Link>
      </div>
      
      <div className="group relative -mx-4 px-4 sm:mx-0 sm:px-0">
        {/* Scroll Buttons (Desktop only) */}
        <button
          onClick={() => scroll('left')}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-20 hidden h-10 w-10 items-center justify-center rounded-full bg-bg-surface/80 text-white shadow-glow-brand backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-bg-surface hover:scale-110 sm:flex"
          aria-label="Scroll left"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <button
          onClick={() => scroll('right')}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-20 hidden h-10 w-10 items-center justify-center rounded-full bg-bg-surface/80 text-white shadow-glow-brand backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-bg-surface hover:scale-110 sm:flex"
          aria-label="Scroll right"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Edge Fade Gradients */}
        <div className="pointer-events-none absolute bottom-0 left-0 top-0 z-10 w-12 bg-gradient-to-r from-bg-base to-transparent opacity-0 transition-opacity group-hover:opacity-100 sm:w-24" />
        <div className="pointer-events-none absolute bottom-0 right-0 top-0 z-10 w-12 bg-gradient-to-l from-bg-base to-transparent opacity-0 transition-opacity group-hover:opacity-100 sm:w-24" />

        {status === "loading" ? (
          <div ref={scrollRef} className="no-scrollbar flex gap-5 overflow-x-auto pb-6 pt-2" aria-busy="true">
            {games.map((game) => (
              <div key={game.id} className="h-56 w-44 flex-shrink-0 animate-pulse rounded-2xl bg-bg-surface sm:h-64 sm:w-52" />
            ))}
          </div>
        ) : (
          <Reveal stagger className="no-scrollbar flex gap-5 overflow-x-auto pb-6 pt-2" variant="slide-right">
            <div ref={scrollRef} className="no-scrollbar flex gap-5 overflow-x-auto pb-2 w-full">
              {games.map((game) => {
                const listed = findListedGame(game.id);
                return (
                  <RevealItem key={game.id} className="w-44 flex-shrink-0 sm:w-52" variant="scale">
                    {listed ? <ListingCard game={listed} /> : <CatalogCard game={game} />}
                  </RevealItem>
                );
              })}
            </div>
          </Reveal>
        )}
      </div>
    </section>
  );
}

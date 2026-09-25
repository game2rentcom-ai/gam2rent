import { m, AnimatePresence } from "motion/react";
import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { CatalogCard } from "../components/CatalogCard";
import { ListingCard } from "../components/ListingCard";
import { Reveal } from "../components/Reveal";
import { catalog } from "../data/catalog";
import { PLATFORM_LABEL, type Platform } from "../data/catalogTypes";
import { Button } from "../components/Button";
import { useStore } from "../data/store";

export function BrowsePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialPlatform = (searchParams.get("platform") as Platform) || "ALL";
  const initialGenre = searchParams.get("genre") || "ALL";
  const initialQuery = searchParams.get("q") || "";

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [platform, setPlatform] = useState<Platform | "ALL">(initialPlatform);
  const [genre, setGenre] = useState<string>(initialGenre);
  const [sortBy, setSortBy] = useState<"featured" | "title-asc" | "title-desc" | "price-low" | "price-high">("featured");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const { findListedGame } = useStore();

  const filteredCatalog = useMemo(() => {
    return catalog.filter((game) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = game.title.toLowerCase().includes(q);
        const matchGenre = game.genre.toLowerCase().includes(q);
        const matchDev = game.developer.toLowerCase().includes(q);
        if (!matchTitle && !matchGenre && !matchDev) return false;
      }
      if (platform !== "ALL" && !game.platforms.includes(platform as Platform)) return false;
      if (genre !== "ALL" && game.genre !== genre) return false;
      return true;
    });
  }, [searchQuery, platform, genre]);

  const sortedCatalog = useMemo(() => {
    const list = [...filteredCatalog];
    if (sortBy === "title-asc") {
      list.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === "title-desc") {
      list.sort((a, b) => b.title.localeCompare(a.title));
    } else if (sortBy === "price-low" || sortBy === "price-high") {
      list.sort((a, b) => {
        const priceA = findListedGame(a.id)?.listing.price ?? 599;
        const priceB = findListedGame(b.id)?.listing.price ?? 599;
        return sortBy === "price-low" ? priceA - priceB : priceB - priceA;
      });
    }
    return list;
  }, [filteredCatalog, sortBy, findListedGame]);

  const allGenres = useMemo(() => {
    const genres = new Set<string>();
    catalog.forEach((g) => genres.add(g.genre));
    return Array.from(genres).sort();
  }, []);

  const listKey = `${platform}-${genre}-${searchQuery}-${sortBy}-${viewMode}`;

  return (
    <div className="flex flex-col gap-8 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand-500">
            Digital Game Storefront
          </span>
          <h1 className="text-3xl sm:text-4xl font-display font-black text-white mt-1">
            Browse All Games
          </h1>
          <p className="text-text-muted text-sm mt-1">
            Rent to play and complete the story, or purchase permanently for your library.
          </p>
        </div>

        {/* Search input */}
        <div className="w-full md:w-72">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSearchParams((prev) => {
                if (e.target.value) prev.set("q", e.target.value);
                else prev.delete("q");
                return prev;
              });
            }}
            placeholder="Search 110+ games..."
            className="w-full rounded-xl border border-white/10 bg-bg-surface px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-500 focus:outline-none shadow-inner"
          />
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass sticky top-[72px] z-30 p-3 sm:p-4 rounded-2xl flex flex-col lg:flex-row gap-4 items-center justify-between border border-white/10">
        {/* Platform Buttons */}
        <div className="flex flex-wrap gap-1.5 items-center w-full lg:w-auto">
          <button
            onClick={() => setPlatform("ALL")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              platform === "ALL"
                ? "bg-brand-500 text-white shadow-glow-brand"
                : "border border-white/10 bg-bg-surface text-text-muted hover:border-white/30 hover:text-white"
            }`}
          >
            All Platforms
          </button>
          {Object.entries(PLATFORM_LABEL).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setPlatform(key as Platform)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                platform === key
                  ? "bg-brand-500 text-white shadow-glow-brand"
                  : "border border-white/10 bg-bg-surface text-text-muted hover:border-white/30 hover:text-white"
              }`}
            >
              {label as string}
            </button>
          ))}
        </div>

        {/* Genre, Sort & View Mode */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
          <select
            value={genre}
            onChange={(e) => {
              setGenre(e.target.value);
              setSearchParams((prev) => {
                if (e.target.value !== "ALL") prev.set("genre", e.target.value);
                else prev.delete("genre");
                return prev;
              });
            }}
            className="bg-bg-surface border border-white/10 rounded-xl px-3 py-1.5 text-xs font-semibold text-text-primary outline-none focus:border-brand-500 min-w-[130px]"
          >
            <option value="ALL">All Genres ({catalog.length})</option>
            {allGenres.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>

          {/* Sort Selector */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-bg-surface border border-white/10 rounded-xl px-3 py-1.5 text-xs font-semibold text-text-primary outline-none focus:border-brand-500 min-w-[130px]"
          >
            <option value="featured">Sort: Featured</option>
            <option value="title-asc">Title: A to Z</option>
            <option value="title-desc">Title: Z to A</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
          </select>

          <div className="flex bg-bg-surface border border-white/10 rounded-xl overflow-hidden p-0.5">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg ${
                viewMode === "grid" ? "bg-brand-500 text-white" : "text-text-muted hover:bg-white/5"
              }`}
              aria-label="Grid view"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-lg ${
                viewMode === "list" ? "bg-brand-500 text-white" : "text-text-muted hover:bg-white/5"
              }`}
              aria-label="List view"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-text-muted px-1">
        <span>
          Showing <strong className="text-white">{sortedCatalog.length}</strong> of{" "}
          {catalog.length} titles
        </span>
        {(platform !== "ALL" || genre !== "ALL" || searchQuery || sortBy !== "featured") && (
          <button
            onClick={() => {
              setPlatform("ALL");
              setGenre("ALL");
              setSearchQuery("");
              setSortBy("featured");
              setSearchParams({});
            }}
            className="text-brand-500 hover:underline"
          >
            Reset all filters
          </button>
        )}
      </div>

      {/* Grid of Games */}
      {sortedCatalog.length > 0 ? (
        <AnimatePresence mode="wait">
          <m.div
            key={listKey}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className={
              viewMode === "grid"
                ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5"
                : "grid grid-cols-1 sm:grid-cols-2 gap-4"
            }
          >
            {sortedCatalog.map((game, i) => {
              const listed = findListedGame(game.id);
              return (
                <Reveal key={game.id} delay={Math.min(i * 0.03, 0.3)} variant="fade-up">
                  {listed ? <ListingCard game={listed} /> : <CatalogCard game={game} />}
                </Reveal>
              );
            })}
          </m.div>
        </AnimatePresence>
      ) : (
        <div className="text-center py-20 glass rounded-3xl border border-white/5">
          <p className="text-xl font-display font-bold text-white mb-2">No matching games found</p>
          <p className="text-sm text-text-muted mb-6">
            Try adjusting your search terms or platform filters.
          </p>
          <Button
            variant="secondary"
            onClick={() => {
              setPlatform("ALL");
              setGenre("ALL");
              setSearchQuery("");
            }}
          >
            Clear All Filters
          </Button>
        </div>
      )}
    </div>
  );
}

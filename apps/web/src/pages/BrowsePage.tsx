import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigationType, useSearchParams } from "react-router-dom";
import { useRequestLink } from "../community/request";
import { PLATFORM_LABEL, type CatalogGame, type Platform } from "../data/catalogTypes";
import { useStore } from "../data/store";
import { searchGames } from "../lib/search";
import { Button } from "../ui/Button";
import { Chip } from "../ui/Chip";
import { Notice } from "../ui/Form";
import { GameCard } from "../ui/GameCard";
import { IconClose, IconFilter, IconSearch } from "../ui/icons";
import { Sheet } from "../ui/Sheet";

// Browse: a compact sticky search bar, platform chips on one scrolling line, everything else in a
// bottom sheet — so the games, not the controls, fill the screen. The filters live in the URL, so a
// filtered view can be shared and the back button works.
const PAGE_SIZE = 24;
type Sort = "recommended" | "title" | "price-low" | "price-high";
const SORTS: { value: Sort; label: string }[] = [
  { value: "recommended", label: "Recommended" },
  { value: "title", label: "Title A–Z" },
  { value: "price-low", label: "Price: low to high" },
  { value: "price-high", label: "Price: high to low" },
];
const PLATFORMS = Object.keys(PLATFORM_LABEL) as Platform[];

// Coming back to the list with the Back button should land where the visitor left it: as many games shown and the
// same scroll position. Remembered per history entry, for this tab only.
interface Left { visible: number; y: number }
const readLeft = (key: string): Left | null => {
  try { return JSON.parse(sessionStorage.getItem(key) ?? "null") as Left | null; } catch { return null; }
};
const writeLeft = (key: string, value: Left) => {
  try { sessionStorage.setItem(key, JSON.stringify(value)); } catch { /* private mode: nothing to remember */ }
};

export function BrowsePage() {
  const { games, findListedGame, status, reload } = useStore();
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const [sheetOpen, setSheetOpen] = useState(false);
  const navigationType = useNavigationType();
  const memory = `browse:${location.key}`;
  const [returning] = useState(() => (navigationType === "POP" ? readLeft(memory) : null));
  const [visible, setVisible] = useState(returning?.visible ?? PAGE_SIZE);
  const urlTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (returning?.y) requestAnimationFrame(() => window.scrollTo(0, returning.y));
  }, [returning]);
  useEffect(() => {
    const remember = () => writeLeft(memory, { visible, y: window.scrollY });
    remember();
    window.addEventListener("scroll", remember, { passive: true });
    return () => window.removeEventListener("scroll", remember);
  }, [memory, visible]);

  const urlQuery = params.get("q") ?? "";
  // The search box owns its text so typing is instant; the URL follows a moment later (the router
  // applies URL changes as low-priority updates, which can drop keystrokes if the input reads from it).
  // A change to the URL that did NOT come from this page (e.g. the header search) replaces the text.
  const [text, setText] = useState(urlQuery);
  const [seenLocation, setSeenLocation] = useState(location.key);
  if (location.key !== seenLocation) {
    setSeenLocation(location.key);
    if (!(location.state as { self?: boolean } | null)?.self) setText(urlQuery);
  }
  const q = text;
  const platform = (PLATFORMS.includes(params.get("platform") as Platform) ? params.get("platform") : "") as Platform | "";
  const genre = params.get("genre") ?? "";
  const sort = (SORTS.some((s) => s.value === params.get("sort")) ? params.get("sort") : "recommended") as Sort;
  const forSale = params.get("forsale") === "1";

  const set = useCallback(
    (changes: Record<string, string | null>) => {
      setVisible(PAGE_SIZE);
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [k, v] of Object.entries(changes)) {
            if (v) next.set(k, v);
            else next.delete(k);
          }
          return next;
        },
        { replace: true, state: { self: true } },
      );
    },
    [setParams],
  );

  const onQueryChange = (value: string) => {
    setText(value);
    clearTimeout(urlTimer.current);
    urlTimer.current = setTimeout(() => set({ q: value || null }), 250);
  };

  const genres = useMemo(() => [...new Set(games.map((g) => g.genre).filter(Boolean))].sort((a, b) => a.localeCompare(b)), [games]);

  const results = useMemo(() => {
    const priceOf = (g: CatalogGame) => findListedGame(g.id)?.listing.price;
    let list = q.trim() ? searchGames(games, q) : [...games];
    if (platform) list = list.filter((g) => g.platforms.includes(platform));
    if (genre) list = list.filter((g) => g.genre === genre);
    if (forSale) list = list.filter((g) => findListedGame(g.id)?.listing.isAvailable);
    if (!q.trim() || sort !== "recommended") {
      list.sort((a, b) => {
        if (sort === "title") return a.title.localeCompare(b.title);
        if (sort === "price-low" || sort === "price-high") {
          const pa = priceOf(a);
          const pb = priceOf(b);
          if (pa === undefined && pb === undefined) return a.title.localeCompare(b.title);
          if (pa === undefined) return 1; // games without a price go last either way
          if (pb === undefined) return -1;
          return sort === "price-low" ? pa - pb : pb - pa;
        }
        // recommended: featured, then priced, then the rest — each alphabetical
        const rank = (g: CatalogGame) => {
          const l = findListedGame(g.id)?.listing;
          return l ? (l.isFeatured ? 0 : 1) : 2;
        };
        return rank(a) - rank(b) || a.title.localeCompare(b.title);
      });
    }
    return list;
  }, [games, findListedGame, q, platform, genre, forSale, sort]);

  const activeFilters = [
    genre && { key: "genre", label: genre },
    forSale && { key: "forsale", label: "Available to buy" },
    sort !== "recommended" && { key: "sort", label: SORTS.find((s) => s.value === sort)!.label },
  ].filter(Boolean) as { key: string; label: string }[];
  const filterCount = activeFilters.length;
  const shown = results.slice(0, visible);
  const request = useRequestLink(q);
  const canRequest = Boolean(request.to ?? request.href);

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="font-display text-2xl font-bold text-text-primary sm:text-3xl">Browse games</h1>
        <p className="mt-1 text-sm text-text-muted">Buy or rent digital games for PC, PlayStation, Xbox and cloud.</p>
      </header>

      <div className="sticky top-14 z-30 -mx-4 flex gap-2 bg-bg-base/95 px-4 py-2 backdrop-blur-xl sm:-mx-6 sm:px-6 md:top-16 lg:-mx-8 lg:px-8">
        <div className="relative min-w-0 flex-1">
          <IconSearch className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted" />
          <input
            type="search"
            value={q}
            onChange={(e) => onQueryChange(e.target.value)}
            enterKeyHint="search"
            autoComplete="off"
            aria-label="Search games"
            placeholder={`Search ${games.length} games`}
            className="field bg-bg-surface pl-11 pr-11"
          />
          {q && (
            <button type="button" onClick={() => { clearTimeout(urlTimer.current); setText(""); set({ q: null }); }} aria-label="Clear search" className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center text-text-muted hover:text-text-primary">
              <IconClose className="h-5 w-5" />
            </button>
          )}
        </div>
        <Button variant="secondary" onClick={() => setSheetOpen(true)} className="relative shrink-0" aria-label={`Filters${filterCount ? `, ${filterCount} active` : ""}`}>
          <IconFilter className="h-5 w-5" />
          <span className="hidden sm:inline">Filters</span>
          {filterCount > 0 && <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-md bg-accent-400 px-1 text-xs font-bold text-black shadow-glow-cyan">{filterCount}</span>}
        </Button>
      </div>

      <div role="group" aria-label="Platform" className="no-scrollbar -mx-4 -my-2 flex gap-2 overflow-x-auto px-4 py-2 sm:mx-0 sm:px-0">
        <Chip selected={!platform} onClick={() => set({ platform: null })}>All</Chip>
        {PLATFORMS.map((p) => (
          <Chip key={p} selected={platform === p} onClick={() => set({ platform: platform === p ? null : p })}>{PLATFORM_LABEL[p]}</Chip>
        ))}
      </div>

      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {activeFilters.map((f) => (
            <button key={f.key} type="button" onClick={() => set({ [f.key]: null })} className="chip chip-on cut gap-1.5 pl-3 pr-2">
              {f.label}
              <IconClose className="h-4 w-4" />
            </button>
          ))}
        </div>
      )}

      <p className="text-sm text-text-muted" aria-live="polite">
        {status === "loading" ? "Loading games…" : `${results.length} ${results.length === 1 ? "game" : "games"}${q.trim() ? ` for “${q.trim()}”` : ""}`}
      </p>

      {status === "error" && <Notice tone="error" onRetry={reload}>We couldn’t load prices and availability just now, so some filters may look empty.</Notice>}

      {results.length === 0 && status === "loading" ? (
        <ul className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 sm:gap-x-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6" aria-hidden="true">
          {Array.from({ length: 12 }, (_, i) => <li key={i} className="aspect-[3/4] animate-pulse rounded-xl bg-bg-surface" />)}
        </ul>
      ) : results.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border-strong px-6 py-14 text-center">
          <p className="font-display text-lg font-bold text-text-primary">No games match</p>
          <p className="max-w-sm text-sm text-text-muted">Try a different spelling or clear the filters. Can’t find a game you want?</p>
          <div className="flex flex-wrap justify-center gap-2">
            <Button variant="secondary" onClick={() => { clearTimeout(urlTimer.current); setText(""); setParams({}, { replace: true, state: { self: true } }); }}>Clear filters</Button>
            {canRequest && <Button {...request}>Request a game</Button>}
          </div>
        </div>
      ) : (
        <>
          <ul className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 sm:gap-x-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {shown.map((g, i) => (
              <li key={g.id} className="min-w-0">
                <GameCard game={g} priority={i < 4} />
              </li>
            ))}
          </ul>
          {results.length > shown.length && (
            <div className="flex flex-col items-center gap-2 pt-2">
              <p className="text-xs text-text-muted">Showing {shown.length} of {results.length}</p>
              <Button variant="secondary" size="lg" onClick={() => setVisible((v) => v + PAGE_SIZE)}>Show more games</Button>
            </div>
          )}
          {canRequest && (
            <p className="flex flex-wrap items-center justify-center pt-2 text-sm text-text-muted">
              Don’t see your game?
              {request.to
                ? <Link to={request.to} className="inline-flex min-h-11 items-center px-2 font-semibold text-brand-400">Request it</Link>
                : <a href={request.href} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center px-2 font-semibold text-brand-400">Request it</a>}
            </p>
          )}
        </>
      )}

      <Sheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Filters"
        footer={
          <div className="flex gap-2">
            <Button variant="secondary" full onClick={() => set({ genre: null, forsale: null, sort: null })}>Reset</Button>
            <Button full onClick={() => setSheetOpen(false)}>Show {results.length} {results.length === 1 ? "game" : "games"}</Button>
          </div>
        }
      >
        <div className="flex flex-col gap-5 pb-2">
          <label className="flex flex-col gap-1.5 text-sm font-semibold text-text-primary">
            Genre
            <select value={genre} onChange={(e) => set({ genre: e.target.value })} className="field font-normal">
              <option value="">All genres</option>
              {genres.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-semibold text-text-primary">
            Sort by
            <select value={sort} onChange={(e) => set({ sort: e.target.value === "recommended" ? null : e.target.value })} className="field font-normal">
              {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </label>
          <label className="flex min-h-11 cursor-pointer items-center justify-between gap-3 text-sm font-semibold text-text-primary">
            Only games available to buy now
            <input type="checkbox" checked={forSale} onChange={(e) => set({ forsale: e.target.checked ? "1" : null })} className="check" />
          </label>
        </div>
      </Sheet>
    </div>
  );
}

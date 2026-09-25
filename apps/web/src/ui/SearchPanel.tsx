import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PLATFORM_LABEL, type CatalogGame, type Platform } from "../data/catalogTypes";
import { useStore } from "../data/store";
import { searchGames } from "../lib/search";
import { GameCover } from "./GameCover";
import { IconSearch } from "./icons";
import { platformLine } from "./format";

// Editorial suggestions for an empty search box — shown only for games that exist in the store.
const SUGGESTED = ["gta-5", "cyberpunk-2077", "elden-ring", "god-of-war", "red-dead-redemption-2", "spider-man-2"];

// Search input + live results. Used full-screen on phones (inside a Sheet) and as a dropdown on
// desktop, so both behave the same.
interface Props {
  query: string;
  onQuery: (q: string) => void;
  onDone: () => void;
  autoFocus?: boolean;
  /** show results in a floating dropdown instead of inline */
  dropdown?: boolean;
  placeholder?: string;
}

export function SearchPanel({ query, onQuery, onDone, autoFocus = false, dropdown = false, placeholder }: Props) {
  const { games, findGame, contactLink } = useStore();
  const navigate = useNavigate();
  const results = useMemo(() => searchGames(games, query, 6), [games, query]);
  const q = query.trim();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(q ? `/browse?q=${encodeURIComponent(q)}` : "/browse");
    onDone();
  };

  return (
    <div className="relative">
      <form onSubmit={submit} role="search" className="relative">
        <IconSearch className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted" />
        <input
          type="search"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          autoFocus={autoFocus}
          enterKeyHint="search"
          autoComplete="off"
          placeholder={placeholder ?? `Search ${games.length} games`}
          aria-label="Search games"
          className="min-h-11 w-full rounded-xl border border-border-subtle bg-bg-surface pl-11 pr-4 text-base text-text-primary outline-none placeholder:text-text-muted focus:border-brand-500"
        />
      </form>

      {q.length < 2 && !dropdown && (
        <div className="mt-6">
          <p className="mb-2 text-sm font-semibold text-text-primary">Popular searches</p>
          <ul className="flex flex-wrap gap-2">
            {SUGGESTED.map(findGame).filter((g): g is CatalogGame => Boolean(g)).map((g) => (
              <li key={g.id}>
                <Link to={`/games/${g.id}`} onClick={onDone} className="inline-flex min-h-10 items-center rounded-full border border-border-subtle bg-bg-surface px-4 text-sm text-text-muted hover:text-text-primary">{g.title}</Link>
              </li>
            ))}
          </ul>
          <p className="mb-2 mt-6 text-sm font-semibold text-text-primary">Browse by platform</p>
          <ul className="flex flex-wrap gap-2">
            {(Object.keys(PLATFORM_LABEL) as Platform[]).map((p) => (
              <li key={p}>
                <Link to={`/browse?platform=${p}`} onClick={onDone} className="inline-flex min-h-10 items-center rounded-full border border-border-subtle bg-bg-surface px-4 text-sm text-text-muted hover:text-text-primary">{PLATFORM_LABEL[p]}</Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {q.length >= 2 && (
        <div className={dropdown ? "absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-white/10 bg-bg-surface shadow-2xl" : "mt-3"}>
          {results.length === 0 ? (
            <p className="flex flex-wrap items-center justify-center px-4 py-4 text-center text-sm text-text-muted">
              No games match “{q}”.
              {contactLink(`Hi! Could you add "${q}" to the store?`) && (
                <a href={contactLink(`Hi! Could you add "${q}" to the store?`)} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center px-2 font-semibold text-brand-500">Request it</a>
              )}
            </p>
          ) : (
            <ul>
              {results.map((g) => (
                <li key={g.id}>
                  <Link to={`/games/${g.id}`} onClick={onDone} className="flex min-h-14 items-center gap-3 px-3 py-2 hover:bg-white/5 active:bg-white/10">
                    <GameCover game={g} slot="card" sizes="48px" className="w-10 shrink-0 rounded-lg" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-text-primary">{g.title}</span>
                      <span className="block truncate text-xs text-text-muted">{platformLine(g.platforms)}</span>
                    </span>
                  </Link>
                </li>
              ))}
              <li>
                <Link to={`/browse?q=${encodeURIComponent(q)}`} onClick={onDone} className="flex min-h-12 items-center justify-center border-t border-white/10 text-sm font-semibold text-brand-500 hover:bg-white/5">
                  See all results for “{q}”
                </Link>
              </li>
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

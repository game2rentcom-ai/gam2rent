import { useCallback, useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useStore } from "../data/store";
import { BottomNav } from "../ui/BottomNav";
import { Button } from "../ui/Button";
import { IconChat, IconClose, IconSearch } from "../ui/icons";
import { SearchPanel } from "../ui/SearchPanel";
import { Sheet } from "../ui/Sheet";

// The app shell: a slim header, the phone bottom navigation, and the footer. Nothing floats over page
// content on a phone; on desktop the header carries the search and contact button.

function Banner() {
  const { source, setting } = useStore();
  const message = setting("announcement");
  const [dismissed, setDismissed] = useState(() => {
    try { return sessionStorage.getItem("banner-dismissed") === (message ?? ""); } catch { return false; }
  });
  const demo = source === "demo" && !import.meta.env.DEV;

  if (demo) {
    return <div className="bg-amber-400 px-4 py-2 text-center text-xs font-semibold text-black">Demo preview — sample prices and reviews shown.</div>;
  }
  if (!message || dismissed) return null;
  return (
    <div className="relative bg-brand-600 px-12 py-2 text-center text-sm font-medium text-white">
      {message}
      <button
        type="button"
        aria-label="Dismiss announcement"
        onClick={() => {
          try { sessionStorage.setItem("banner-dismissed", message); } catch { /* private mode: just hide it for now */ }
          setDismissed(true);
        }}
        className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center text-white/80 hover:text-white"
      >
        <IconClose className="h-5 w-5" />
      </button>
    </div>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const { pathname, hash } = useLocation();
  // The search sheet is "open for" the page it was opened on, so navigating anywhere closes it
  // without an effect having to reset state.
  const [searchOpenAt, setSearchOpenAt] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const chatHref = useStore().contactLink("Hi! I have a question about renting or buying games.");
  const searchOpen = searchOpenAt === pathname + hash;
  const openSearch = useCallback(() => setSearchOpenAt(pathname + hash), [pathname, hash]);
  const closeSearch = useCallback(() => {
    setSearchOpenAt(null);
    setQuery("");
  }, []);

  // A new page starts at the top (unless the link points at a section on it).
  useEffect(() => {
    if (!hash) window.scrollTo(0, 0);
  }, [pathname, hash]);

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `flex min-h-11 items-center px-3 text-sm font-semibold transition-colors ${isActive ? "text-text-primary" : "text-text-muted hover:text-text-primary"}`;

  return (
    <div className="flex min-h-dvh flex-col bg-bg-base font-sans text-text-primary selection:bg-brand-500 selection:text-white">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-[80] focus:rounded-lg focus:bg-brand-500 focus:px-4 focus:py-2 focus:text-white">
        Skip to content
      </a>
      <Banner />

      <header className="sticky top-0 z-40 border-b border-white/5 bg-bg-base/90 backdrop-blur-xl">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-2 px-4 sm:px-6 md:h-16 lg:px-8">
          <Link to="/" aria-label="GameBuy — home" className="-ml-1 flex min-h-11 shrink-0 items-center px-1 font-display text-2xl font-black tracking-tighter">
            <span className="text-gradient-brand">Game</span>
            <span className="text-white">Buy</span>
          </Link>

          <nav aria-label="Primary" className="ml-4 hidden items-center md:flex">
            <NavLink to="/" end className={navClass}>Home</NavLink>
            <NavLink to="/browse" className={navClass}>Browse</NavLink>
          </nav>

          <div className="ml-auto hidden w-full max-w-sm md:block lg:max-w-md">
            <SearchPanel query={query} onQuery={setQuery} onDone={() => setQuery("")} dropdown />
          </div>

          <div className="ml-auto flex items-center gap-1 md:ml-2">
            <button
              type="button"
              onClick={openSearch}
              aria-label="Search games"
              className="flex h-11 w-11 items-center justify-center rounded-full text-text-primary hover:bg-white/5 md:hidden"
            >
              <IconSearch />
            </button>
            <div className="hidden md:block">
              <Button href={chatHref} size="sm" variant="secondary">
                <IconChat className="h-5 w-5" />
                Message us
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main id="main" className="mx-auto w-full max-w-7xl flex-1 px-4 pb-10 pt-4 sm:px-6 md:pb-12 md:pt-6 lg:px-8">
        {children}
      </main>

      <footer className="border-t border-white/5 bg-bg-surface pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-3 lg:px-8">
          <div>
            <p className="font-display text-2xl font-black tracking-tighter">
              <span className="text-gradient-brand">Game</span>
              <span className="text-white">Buy</span>
            </p>
            <p className="mt-3 max-w-xs text-sm text-text-muted">Buy or rent digital games for PC, PlayStation, Xbox and cloud gaming.</p>
          </div>
          <nav aria-label="Legal">
            <h2 className="font-display text-sm font-bold text-text-primary">Policies</h2>
            <ul className="mt-3 space-y-1 text-sm text-text-muted">
              {[["terms", "Terms of Service"], ["privacy", "Privacy Policy"], ["refund", "Refund & Replacement"], ["shipping", "Delivery Times"]].map(([slug, label]) => (
                <li key={slug}><Link to={`/policies/${slug}`} className="flex min-h-11 items-center hover:text-text-primary">{label}</Link></li>
              ))}
            </ul>
          </nav>
          <div>
            <h2 className="font-display text-sm font-bold text-text-primary">Need help?</h2>
            <p className="mt-3 text-sm text-text-muted">Questions about a game, an order or renting? We reply fast.</p>
            <Button href={chatHref} variant="secondary" size="md" className="mt-3">
              <IconChat className="h-5 w-5" />
              Message us
            </Button>
          </div>
        </div>
        <p className="border-t border-white/5 py-4 text-center text-xs text-text-muted">© {new Date().getFullYear()} GameBuy. All rights reserved.</p>
      </footer>

      {/* Game pages have their own sticky buy bar in this spot */}
      {!pathname.startsWith("/games/") && <BottomNav onSearch={openSearch} chatHref={chatHref} />}

      <Sheet open={searchOpen} onClose={closeSearch} title="Search games" variant="full">
        <div className="pb-4 pt-1">
          <SearchPanel query={query} onQuery={setQuery} onDone={closeSearch} autoFocus />
        </div>
      </Sheet>
    </div>
  );
}

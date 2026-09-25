import { m, AnimatePresence } from "motion/react";
import { useState, useEffect, useRef, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { whatsAppLink } from "../config";
import { useStore } from "../data/store";
import { catalog } from "../data/catalog";
import { getGameBoxArt } from "../data/gameImages";
import { SoundToggle } from "./SoundToggle";
import { soundFx } from "../utils/soundEffects";

function DemoBanner() {
  const { source } = useStore();
  if (source !== "demo" || import.meta.env.DEV) return null;
  return (
    <div className="bg-amber-400 px-4 py-1 text-center text-xs font-semibold text-black relative z-50">
      Demo preview — sample prices and reviews shown.
    </div>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const demo = useStore().source === "demo" && !import.meta.env.DEV;
  const chatLink = whatsAppLink("Hi! I have a question about renting or buying games.");
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setSearchFocused(false);
  }, [location.pathname]);

  // Click outside to close search dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const liveSearchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (q.length < 2) return [];
    return catalog
      .filter((g) => {
        return (
          g.title.toLowerCase().includes(q) ||
          g.franchise.toLowerCase().includes(q) ||
          g.genre.toLowerCase().includes(q)
        );
      })
      .slice(0, 5);
  }, [searchQuery]);

  const onSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchFocused(false);
    if (searchQuery.trim()) {
      navigate(`/browse?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate("/browse");
    }
  };

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Browse Games", path: "/browse" },
  ];

  return (
    <div
      className="min-h-screen flex flex-col bg-bg-base text-text-primary font-sans relative selection:bg-brand-500 selection:text-white"
      style={{ "--banner-h": demo ? "36px" : "0px" } as React.CSSProperties}
    >
      {demo && <DemoBanner />}

      {/* Sticky Header with perfect horizontal alignment */}
      <header
        className={`sticky top-0 z-50 transition-all duration-300 border-b ${
          scrolled
            ? "py-3 bg-bg-base/90 backdrop-blur-xl border-white/10 shadow-2xl"
            : "py-4 bg-bg-base/85 backdrop-blur-md border-white/5"
        }`}
      >
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link
            to="/"
            className="font-display font-black text-2xl tracking-tighter text-text-primary group flex items-center gap-1 shrink-0"
          >
            <span className="text-gradient-brand">Game</span>
            <span className="text-white">Buy</span>
            <span className="h-1.5 w-1.5 rounded-full bg-brand-500 ml-0.5 group-hover:scale-150 transition-transform" />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`relative transition-colors ${
                  location.pathname === link.path
                    ? "text-brand-100"
                    : "text-text-muted hover:text-white"
                }`}
              >
                {link.name}
                {location.pathname === link.path && (
                  <m.div
                    layoutId="activeNavIndicator"
                    className="absolute -bottom-1 left-0 right-0 h-[2px] bg-brand-500 rounded-full"
                  />
                )}
              </Link>
            ))}
          </nav>

          {/* Search bar & WhatsApp support action */}
          <div className="hidden sm:flex items-center gap-3">
            <div ref={searchContainerRef} className="relative">
              <form onSubmit={onSearchSubmit} className="relative">
                <div
                  className={`relative transition-all duration-300 ${
                    searchFocused ? "w-64" : "w-48 lg:w-56"
                  }`}
                >
                  <input
                    type="text"
                    placeholder="Search games..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setSearchFocused(true)}
                    className={`w-full bg-bg-surface/80 border rounded-xl py-2 pl-9 pr-3 text-xs text-text-primary placeholder:text-text-muted outline-none transition-all ${
                      searchFocused
                        ? "border-brand-500 shadow-glow-brand bg-bg-surface"
                        : "border-white/10 hover:border-white/25"
                    }`}
                  />
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
              </form>

              {/* Instant Search Floating Dropdown */}
              <AnimatePresence>
                {searchFocused && liveSearchResults.length > 0 && (
                  <m.div
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    transition={{ duration: 0.18 }}
                    className="absolute right-0 top-full mt-2 w-80 rounded-2xl bg-bg-surface-raised/95 backdrop-blur-xl border border-white/15 shadow-2xl p-2 z-50 overflow-hidden"
                  >
                    <div className="px-2.5 py-1.5 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-text-muted border-b border-white/5 mb-1">
                      <span>Instant Results</span>
                      <span className="text-brand-500 font-semibold">{liveSearchResults.length} found</span>
                    </div>
                    <div className="flex flex-col gap-1 max-h-[300px] overflow-y-auto">
                      {liveSearchResults.map((game) => (
                        <Link
                          key={game.id}
                          to={`/game/${game.id}`}
                          onClick={() => {
                            setSearchFocused(false);
                            setSearchQuery("");
                          }}
                          className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/10 transition-colors group"
                        >
                          <img
                            src={getGameBoxArt(game.id)}
                            alt={game.title}
                            className="w-9 h-12 object-cover rounded-lg border border-white/10 group-hover:border-brand-500 shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-display text-xs font-bold text-white group-hover:text-brand-100 truncate">
                              {game.title}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] text-text-muted truncate">{game.genre}</span>
                              <span className="text-[10px] text-trust-600 font-semibold">• Rent / Buy</span>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchFocused(false);
                        navigate(`/browse?q=${encodeURIComponent(searchQuery.trim())}`);
                      }}
                      className="w-full text-center py-2 text-xs font-bold text-brand-400 hover:text-brand-300 border-t border-white/5 mt-1 block"
                    >
                      View all results for &ldquo;{searchQuery}&rdquo; →
                    </button>
                  </m.div>
                )}
              </AnimatePresence>
            </div>

            <SoundToggle />

            <a
              href={chatLink}
              target="_blank"
              rel="noreferrer"
              onClick={() => soundFx.playClick()}
              className="inline-flex items-center gap-2 rounded-xl border border-trust-600/30 bg-trust-600/10 px-3.5 py-2 text-xs font-bold text-trust-600 hover:bg-trust-600/20 transition-all hover:scale-105 shrink-0"
            >
              <span className="h-2 w-2 rounded-full bg-trust-600 animate-pulse" />
              <span>Live Support</span>
            </a>
          </div>

          {/* Mobile Actions: Sound Toggle + Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <SoundToggle />
            <button
              onClick={() => {
                soundFx.playClick();
                setMobileMenuOpen(!mobileMenuOpen);
              }}
              className="p-2 rounded-xl bg-bg-surface border border-white/10 text-text-muted hover:text-white"
              aria-label="Toggle Menu"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <m.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed inset-0 z-40 bg-bg-base/98 backdrop-blur-2xl pt-24 px-6 flex flex-col justify-between pb-8 md:hidden overflow-y-auto"
          >
            <div className="flex flex-col gap-6">
              <div ref={mobileSearchRef} className="relative w-full">
                <form onSubmit={onSearchSubmit} className="relative w-full">
                  <input
                    type="text"
                    placeholder="Search 110+ games..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-bg-surface border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-text-primary outline-none focus:border-brand-500"
                  />
                  <svg
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </form>

                {/* Mobile Search Results */}
                {liveSearchResults.length > 0 && (
                  <div className="mt-2 rounded-2xl bg-bg-surface-raised border border-white/15 p-2 flex flex-col gap-1">
                    {liveSearchResults.map((game) => (
                      <Link
                        key={game.id}
                        to={`/game/${game.id}`}
                        onClick={() => {
                          setMobileMenuOpen(false);
                          setSearchQuery("");
                        }}
                        className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/10"
                      >
                        <img
                          src={getGameBoxArt(game.id)}
                          alt={game.title}
                          className="w-9 h-12 object-cover rounded-lg border border-white/10 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-display text-xs font-bold text-white truncate">
                            {game.title}
                          </p>
                          <span className="text-[10px] text-text-muted">{game.genre}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <nav className="flex flex-col gap-4 text-lg font-display font-bold">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.path}
                    className={`py-2 border-b border-white/5 ${
                      location.pathname === link.path ? "text-brand-500" : "text-white"
                    }`}
                  >
                    {link.name}
                  </Link>
                ))}
              </nav>
            </div>

            <a
              href={chatLink}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 rounded-xl bg-trust-600 py-3.5 text-sm font-bold text-black shadow-glow-trust"
            >
              <span>Chat with Support on WhatsApp</span>
            </a>
          </m.div>
        )}
      </AnimatePresence>

      {/* Main Content with uniform horizontal boundaries */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {children}
      </main>

      {/* Footer with matched horizontal margins */}
      <footer className="mt-auto border-t border-white/10 bg-bg-surface/80 backdrop-blur-md">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
            {/* Col 1: Brand */}
            <div className="md:col-span-2">
              <Link to="/" className="font-display font-black text-2xl tracking-tighter text-white inline-block mb-3">
                <span className="text-gradient-brand">Game</span>Buy
              </Link>
              <p className="text-text-muted text-xs sm:text-sm max-w-sm leading-relaxed mb-4">
                The next-generation digital storefront for gaming enthusiasts. Rent to finish the story or buy to own permanently on PC, PlayStation, and Xbox.
              </p>
              <div className="flex items-center gap-2 text-xs font-semibold text-trust-600">
                <span className="h-2 w-2 rounded-full bg-trust-600 animate-pulse" />
                <span>Active 24/7 Digital Fulfillment</span>
              </div>
            </div>

            {/* Col 2: Navigation */}
            <div>
              <h4 className="font-display text-xs font-bold uppercase tracking-wider text-white mb-3">
                Navigation
              </h4>
              <ul className="space-y-2 text-xs text-text-muted">
                <li>
                  <Link to="/" className="hover:text-white transition-colors">Home</Link>
                </li>
                <li>
                  <Link to="/browse" className="hover:text-white transition-colors">Browse Catalog</Link>
                </li>
                <li>
                  <Link to="/browse?platform=pc" className="hover:text-white transition-colors">PC Games</Link>
                </li>
                <li>
                  <Link to="/browse?platform=ps5" className="hover:text-white transition-colors">PS5 / PS4 Games</Link>
                </li>
              </ul>
            </div>

            {/* Col 3: Legal & Support */}
            <div>
              <h4 className="font-display text-xs font-bold uppercase tracking-wider text-white mb-3">
                Help & Terms
              </h4>
              <ul className="space-y-2 text-xs text-text-muted">
                <li>
                  <Link to="/policies/terms" className="hover:text-white transition-colors">Terms of Service</Link>
                </li>
                <li>
                  <Link to="/policies/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
                </li>
                <li>
                  <Link to="/policies/refund" className="hover:text-white transition-colors">Refund & Replacement</Link>
                </li>
                <li>
                  <Link to="/policies/shipping" className="hover:text-white transition-colors">Delivery ETA</Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-text-muted">
            <p>© {new Date().getFullYear()} GameBuy. All rights reserved.</p>
            <p className="flex items-center gap-1">
              Crafted for passionate gamers across India.
            </p>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp Action Button */}
      {chatLink && (
        <a
          href={chatLink}
          target="_blank"
          rel="noreferrer"
          aria-label="Chat on WhatsApp"
          className="fixed bottom-6 right-6 z-40 flex h-13 w-13 items-center justify-center rounded-full bg-trust-600 text-black shadow-glow-trust hover:scale-110 active:scale-95 transition-transform"
        >
          <svg className="w-7 h-7 fill-current" viewBox="0 0 24 24">
            <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.29-1.39a9.9 9.9 0 004.75 1.21h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2zm0 18.02h-.01a8.1 8.1 0 01-4.13-1.13l-.3-.18-3.14.82.84-3.06-.19-.31a8.14 8.14 0 01-1.24-4.35c0-4.5 3.66-8.16 8.17-8.16 2.18 0 4.23.85 5.77 2.39a8.1 8.1 0 012.39 5.77c0 4.51-3.66 8.17-8.16 8.17zm4.48-6.12c-.25-.12-1.45-.72-1.68-.8-.22-.08-.39-.12-.55.12-.16.25-.63.8-.78.96-.14.16-.29.18-.53.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.48-1.39-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.14.16-.25.25-.41.08-.16.04-.31-.02-.43-.06-.12-.55-1.33-.76-1.82-.2-.48-.4-.42-.55-.42h-.47c-.16 0-.43.06-.65.31-.22.25-.86.84-.86 2.05 0 1.21.88 2.38 1 2.54.12.16 1.73 2.64 4.2 3.7.59.25 1.04.4 1.4.52.59.19 1.12.16 1.54.1.47-.07 1.45-.59 1.65-1.16.2-.57.2-1.06.14-1.16-.06-.1-.22-.16-.47-.28z" />
          </svg>
        </a>
      )}
    </div>
  );
}

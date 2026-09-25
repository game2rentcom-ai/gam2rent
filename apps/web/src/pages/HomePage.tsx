import { useState } from "react";
import { Link } from "react-router-dom";
import { DashboardHero } from "../components/DashboardHero";
import { GameRail } from "../components/GameRail";
import { HowItWorks } from "../components/HowItWorks";
import { ListingCard } from "../components/ListingCard";
import { CatalogCard } from "../components/CatalogCard";
import { StatsStrip } from "../components/StatsStrip";
import { Testimonials } from "../components/Testimonials";
import { TrustStrip } from "../components/TrustStrip";
import { Button } from "../components/Button";
import { FAQAccordion } from "../components/FAQAccordion";
import { catalog } from "../data/catalog";
import { PLATFORM_LABEL } from "../data/catalogTypes";
import { useStore } from "../data/store";
import { SITE_GAMING_ASSETS } from "../data/gameImages";
import { whatsAppLink } from "../config";
import { soundFx } from "../utils/soundEffects";

// Featured AAA Spotlight titles with 4K wallpapers
const HERO_SLIDE_IDS = [
  "gta-5",
  "cyberpunk-2077",
  "black-myth-wukong",
  "elden-ring",
  "spider-man-2",
  "god-of-war",
];

const NEW_RELEASE_IDS = [
  "silent-hill-2",
  "dragon-ball-sparking-zero",
  "marvel-rivals",
  "ea-sports-fc",
  "astro-bot",
  "tekken",
  "call-of-duty",
];

const POPULAR_IDS = [
  "gta-5",
  "red-dead-redemption-2",
  "cyberpunk-2077",
  "elden-ring",
  "the-witcher-3",
  "god-of-war",
  "ghost-of-tsushima",
  "forza-horizon-5",
];

type FilterTab = "all" | "rent" | "buy" | "ps5" | "pc";

const HOME_FAQS = [
  {
    q: "How does digital game renting work on GameBuy?",
    a: "Select the game you want to play. We deliver verified digital access credentials directly to your WhatsApp within 15–30 minutes. You log in on your PlayStation, Xbox, or PC, set the profile as primary, download the official game files directly from the platform store, and play on your own personal profile.",
  },
  {
    q: "Do I get to keep my personal save files and trophies?",
    a: "Yes, 100%! Because you add the account as a primary profile, you play directly from your own personal user profile. All achievements, trophies, cloud saves, and story progress remain permanently tied to your own gamer account.",
  },
  {
    q: "Is there any risk of getting my console or account banned?",
    a: "None. All licenses are 100% genuine and purchased directly through official platform channels (Sony PlayStation Store, Valve Steam, Microsoft Xbox). There is zero console modding, jailbreaking, or unauthorized software involved.",
  },
  {
    q: "What is the difference between Renting and Buying to Own?",
    a: "Renting gives you complete access to play and finish the campaign at an ultra-affordable flat price (e.g. ₹149) with zero recurring commitments or daily charges. Buying gives you permanent, lifetime ownership of the title to keep in your library forever.",
  },
  {
    q: "Can I extend my rental if I need more time to finish?",
    a: "Absolutely! If you're enjoying the game and need more time, simply reach out to us on WhatsApp before your access ends to extend your rental or upgrade to permanent ownership by simply paying the difference.",
  },
];

export function HomePage() {
  const { listedGames, findListedGame } = useStore();
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  const heroSlides = HERO_SLIDE_IDS.map((id) => catalog.find((g) => g.id === id)).filter(
    (g): g is NonNullable<typeof g> => Boolean(g)
  );

  // Filtered games for quick interactive tab showcase
  const tabGames = catalog.filter((game) => {
    if (activeTab === "all") return true;
    if (activeTab === "rent") return true; // all games support rent
    if (activeTab === "buy") return listedGames.some((l) => l.id === game.id);
    if (activeTab === "ps5") return game.platforms.includes("ps5") || game.platforms.includes("ps4");
    if (activeTab === "pc") return game.platforms.includes("pc");
    return true;
  }).slice(0, 8);

  return (
    <div className="relative flex flex-col gap-16 sm:gap-24 pb-20">
      {/* 4K Subtle Ambient Background Backdrop */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <img
          src={SITE_GAMING_ASSETS.cyberCity4K}
          alt="Atmosphere"
          className="h-full w-full object-cover opacity-[0.06] filter blur-xl"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-bg-base via-transparent to-bg-base" />
      </div>

      {/* Hero Header & AAA Spotlight Stage */}
      <section className="flex flex-col gap-8 pt-2">
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto gap-3.5 px-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-500/40 bg-brand-500/10 px-4 py-1.5 text-xs font-bold text-brand-100 backdrop-blur-md">
            <span>🎮</span>
            <span>NEXT-GEN GAMING STOREFRONT</span>
          </div>

          <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
            Rent or Buy Any Game. <span className="text-gradient">Play Today.</span>
          </h1>

          <p className="text-sm sm:text-base text-text-muted max-w-xl leading-relaxed">
            Instant digital access on PC, PS5, PS4 & Xbox. Rent to finish the story or buy permanent ownership for your collection.
          </p>
        </div>

        {/* Dashboard Hero Carousel */}
        <DashboardHero slides={heroSlides} />

        {/* Trust Strip */}
        <TrustStrip />
      </section>

      {/* Interactive Quick Filter Showcase */}
      <section className="flex flex-col gap-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-brand-500">
              Browse Highlights
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-black text-white mt-0.5">
              Trending for Rent & Buy
            </h2>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: "all", label: "🔥 All Games" },
              { id: "rent", label: "⚡ Available for Rent" },
              { id: "buy", label: "💎 Buy to Own" },
              { id: "ps5", label: "🎮 PlayStation" },
              { id: "pc", label: "💻 PC Steam" },
            ].map((tab) => (
              <button
                key={tab.id}
                onMouseEnter={() => soundFx.playHover()}
                onClick={() => {
                  soundFx.playSuccess();
                  setActiveTab(tab.id as FilterTab);
                }}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition-all duration-200 ${
                  activeTab === tab.id
                    ? "bg-brand-500 text-white shadow-glow-brand scale-105"
                    : "border border-white/10 bg-bg-surface text-text-muted hover:border-white/30 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Game Cards Grid with generous spacing */}
        <div className="grid grid-cols-2 gap-4 sm:gap-6 sm:grid-cols-3 lg:grid-cols-4">
          {tabGames.map((game) => {
            const listed = findListedGame(game.id);
            return listed ? (
              <ListingCard key={game.id} game={listed} />
            ) : (
              <CatalogCard key={game.id} game={game} />
            );
          })}
        </div>

        <div className="flex justify-center pt-4">
          <Link to="/browse">
            <Button variant="secondary" size="lg" className="px-10 py-4 text-sm font-display">
              Explore All 110+ Games in Catalog →
            </Button>
          </Link>
        </div>
      </section>

      {/* 4K Gamified Battle Station Showcase */}
      <section className="relative overflow-hidden rounded-3xl border border-white/15 p-8 sm:p-14 shadow-2xl">
        {/* 4K Real Gaming Rig Background */}
        <img
          src={SITE_GAMING_ASSETS.heroBg}
          alt="4K Gaming Rig"
          className="absolute inset-0 h-full w-full object-cover opacity-25 filter blur-[2px] transition-transform duration-1000 hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-bg-base via-bg-base/95 to-bg-base/80" />

        <div className="relative z-10 flex flex-col gap-10">
          <div className="max-w-xl">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-400">
              The Smarter Way to Game
            </span>
            <h2 className="font-display text-2xl sm:text-4xl font-black text-white mt-1.5 leading-tight">
              Play more games. Spend significantly less.
            </h2>
            <p className="text-sm sm:text-base text-text-muted mt-3 leading-relaxed">
              Why pay full price for a 15-hour campaign? Rent it, enjoy the full experience, or buy permanent ownership if you love the game.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="glass p-6 sm:p-7 rounded-2xl border border-white/10 hover:border-brand-500/50 transition-all duration-300 hover:-translate-y-1">
              <span className="text-3xl">🎮</span>
              <h3 className="font-display text-lg font-bold text-white mt-3 mb-1.5">
                Huge Curated Catalog
              </h3>
              <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
                Over 110+ blockbuster titles across PC, PlayStation, Xbox, and Cloud Gaming ready for delivery.
              </p>
            </div>

            {/* Card 2 */}
            <div className="glass p-6 sm:p-7 rounded-2xl border border-white/10 hover:border-trust-600/50 transition-all duration-300 hover:-translate-y-1">
              <span className="text-3xl">⚡</span>
              <h3 className="font-display text-lg font-bold text-white mt-3 mb-1.5">
                Fast 15–30m Delivery
              </h3>
              <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
                Receive your login credentials or QR code directly on WhatsApp. Quick, private, and effortless.
              </p>
            </div>

            {/* Card 3 */}
            <div className="glass p-6 sm:p-7 rounded-2xl border border-white/10 hover:border-accent-400/50 transition-all duration-300 hover:-translate-y-1">
              <span className="text-3xl">💬</span>
              <h3 className="font-display text-lg font-bold text-white mt-3 mb-1.5">
                Direct Gamer Support
              </h3>
              <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
                Have questions or need assistance setting up your game? Our team is available directly on chat.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section>
        <StatsStrip
          catalogSize={catalog.filter((g) => g.category === "game").length}
          platformCount={new Set(catalog.flatMap((g) => g.platforms)).size}
        />
      </section>

      {/* Rails: New Releases & Popular */}
      <div className="flex flex-col gap-14">
        <GameRail title="New Releases & Pre-Orders" ids={NEW_RELEASE_IDS} />
        <GameRail title="Most Played Blockbusters" ids={POPULAR_IDS} />
      </div>

      {/* Platform Category Selector */}
      <section className="flex flex-col items-center gap-5">
        <span className="text-xs font-bold uppercase tracking-[0.15em] text-text-muted">
          Supported Platforms
        </span>
        <div className="flex flex-wrap justify-center gap-3">
          {(Object.keys(PLATFORM_LABEL) as (keyof typeof PLATFORM_LABEL)[]).map((platform) => (
            <Link
              key={platform}
              to={`/browse?platform=${platform}`}
              className="flex items-center gap-2.5 rounded-2xl border border-white/10 bg-bg-surface px-6 py-3.5 text-sm font-semibold text-text-primary transition-all duration-200 hover:border-brand-500 hover:text-brand-100 hover:shadow-glow-brand hover:scale-105"
            >
              <span>{PLATFORM_LABEL[platform]}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <HowItWorks />

      {/* Rent vs Buy Comparison Card */}
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-bg-surface/50 p-8 sm:p-12 backdrop-blur-md">
        <div className="flex flex-col gap-8 max-w-4xl mx-auto">
          <div className="text-center flex flex-col gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-500">
              Smart Gamer Economics
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-black text-white">
              Rent or Buy: Pick What Fits Your Playstyle
            </h2>
            <p className="text-sm text-text-muted max-w-lg mx-auto">
              Different games deserve different choices. Choose the flexible model that gives you maximum value.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Rent Box */}
            <div className="p-6 rounded-2xl border border-trust-600/30 bg-trust-600/5 flex flex-col justify-between gap-4">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="rounded-md bg-trust-600/20 text-trust-600 border border-trust-600/30 px-2.5 py-1 text-xs font-bold uppercase tracking-wider">
                    ⚡ Option 1: Rent
                  </span>
                  <span className="text-xs text-trust-600 font-bold">Save up to 80%</span>
                </div>
                <h3 className="font-display text-xl font-bold text-white mb-2">
                  Complete Single-Player Stories
                </h3>
                <p className="text-xs sm:text-sm text-text-muted leading-relaxed mb-4">
                  Cinematic AAA games (God of War, Spider-Man 2, Silent Hill 2, Black Myth: Wukong) take 15–30 hours to finish and are rarely replayed. Renting gives you the full experience for a fraction of the cost.
                </p>
                <ul className="space-y-2 text-xs text-text-secondary">
                  <li className="flex items-center gap-2">
                    <span className="text-trust-600 font-bold">✓</span> Flat, transparent price per game
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-trust-600 font-bold">✓</span> Full campaign access & official updates
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-trust-600 font-bold">✓</span> Zero physical return hassles
                  </li>
                </ul>
              </div>
              <Link to="/browse">
                <Button variant="secondary" size="sm" className="w-full text-xs font-bold">
                  Browse Rentable Games →
                </Button>
              </Link>
            </div>

            {/* Buy Box */}
            <div className="p-6 rounded-2xl border border-brand-500/30 bg-brand-500/5 flex flex-col justify-between gap-4">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="rounded-md bg-brand-500/20 text-brand-100 border border-brand-500/30 px-2.5 py-1 text-xs font-bold uppercase tracking-wider">
                    💎 Option 2: Buy
                  </span>
                  <span className="text-xs text-brand-400 font-bold">Permanent Access</span>
                </div>
                <h3 className="font-display text-xl font-bold text-white mb-2">
                  Own Endless Replay Staples
                </h3>
                <p className="text-xs sm:text-sm text-text-muted leading-relaxed mb-4">
                  For games you return to year-round (GTA V, EA Sports FC 25, Call of Duty, Elden Ring, Forza Horizon 5), permanent ownership lets you keep them in your collection forever.
                </p>
                <ul className="space-y-2 text-xs text-text-secondary">
                  <li className="flex items-center gap-2">
                    <span className="text-brand-500 font-bold">✓</span> One-time payment, lifetime ownership
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-brand-500 font-bold">✓</span> Online multiplayer & continuous updates
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-brand-500 font-bold">✓</span> Instant WhatsApp delivery & setup support
                  </li>
                </ul>
              </div>
              <Link to="/browse">
                <Button variant="primary" size="sm" className="w-full text-xs font-bold">
                  Browse Buy to Own Games →
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <Testimonials />

      {/* Frequently Asked Questions */}
      <section className="pt-4">
        <FAQAccordion
          items={HOME_FAQS}
          subtitle="Clear Answers"
          title="Frequently Asked Questions"
        />
      </section>

      {/* Closing Call to Action with 4K Background */}
      <section className="relative overflow-hidden rounded-3xl border border-brand-500/40 bg-gradient-to-r from-brand-900/30 via-bg-surface to-brand-900/30 p-8 sm:p-14 text-center">
        <div className="relative z-10 flex flex-col items-center gap-4 max-w-xl mx-auto">
          <span className="rounded-full bg-brand-500/20 px-3.5 py-1 text-xs font-bold text-brand-100 border border-brand-500/30">
            ⚡ Ready to Game?
          </span>
          <h2 className="font-display text-2xl sm:text-4xl font-black text-white leading-tight">
            Your next adventure is ready to download.
          </h2>
          <p className="text-sm text-text-muted leading-relaxed">
            Choose any game to rent or buy. Fast delivery, instant access, verified accounts.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mt-2">
            <Link to="/browse">
              <Button size="lg" glow>
                Browse All Games
              </Button>
            </Link>
            <a
              href={whatsAppLink("Hi! I have a question about renting or buying a game on GameBuy.")}
              target="_blank"
              rel="noreferrer"
            >
              <Button variant="secondary" size="lg">
                Chat on WhatsApp
              </Button>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

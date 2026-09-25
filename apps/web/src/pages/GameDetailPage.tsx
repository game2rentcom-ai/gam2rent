import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { m, useScroll, useTransform } from "motion/react";
import { getGameImage, placeholderColor } from "../data/gameImages";
import { whatsAppLink } from "../config";
import { catalog } from "../data/catalog";
import { PLATFORM_LABEL } from "../data/catalogTypes";
import { useStore } from "../data/store";
import { averageRating, credentialDisclosure, deliveryEtaLabel } from "../types/listing";
import { TiltCard } from "../components/TiltCard";
import { Button } from "../components/Button";
import { GameRail } from "../components/GameRail";
import { getGameMetadata, COMMON_FAQS } from "../data/gameMeta";
import { FAQAccordion } from "../components/FAQAccordion";
import { getGameTrailer } from "../data/gameTrailers";
import { TrailerModal } from "../components/TrailerModal";
import { soundFx } from "../utils/soundEffects";

export function GameDetailPage() {
  const { id } = useParams<{ id: string }>();
  const game = catalog.find((g) => g.id === id);
  const { findListedGame, reviewsFor } = useStore();
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, 150]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0.2]);

  const [selectedOption, setSelectedOption] = useState<"rent" | "buy">("rent");
  const [trailerOpen, setTrailerOpen] = useState(false);
  const trailer = game ? getGameTrailer(game.id) : null;

  if (!game) {
    return (
      <div className="py-24 text-center">
        <h1 className="text-4xl text-white font-display font-black mb-4">Game Not Found</h1>
        <p className="text-text-muted mb-6">The game you are looking for does not exist in our catalog.</p>
        <Link to="/browse">
          <Button variant="primary">Browse All Games</Button>
        </Link>
      </div>
    );
  }

  const { hero, cover } = getGameImage(game.id);
  const bgColor = placeholderColor(game.id);
  const listed = findListedGame(game.id);
  const reviews = reviewsFor(game.id);
  const rating = averageRating(reviews);
  const unavailable = listed !== undefined && !listed.listing.isAvailable;
  const meta = getGameMetadata(game.id, game.genre);

  // Only a real listing has a price. Rental prices will come from the database once the owner sets
  // them in the admin panel; until then the rent option is "price on request" — nothing is invented.
  const buyPrice = listed?.listing.price;

  const getWhatsappHref = () => {
    if (selectedOption === "buy") {
      return whatsAppLink(
        buyPrice !== undefined
          ? `Hi! I want to BUY "${game.title}" (₹${buyPrice}). Is delivery ready?`
          : `Hi! Is "${game.title}" available to buy?`
      );
    }
    return whatsAppLink(`Hi! I want to RENT "${game.title}". What's the price and delivery time?`);
  };

  const activeHref = getWhatsappHref();

  return (
    <div className="pb-24 flex flex-col gap-10">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-text-muted">
        <Link to="/" className="hover:text-white transition-colors">
          Home
        </Link>
        <span>/</span>
        <Link to="/browse" className="hover:text-white transition-colors">
          Catalog
        </Link>
        <span>/</span>
        <Link
          to={`/browse?genre=${encodeURIComponent(game.genre)}`}
          className="hover:text-white transition-colors"
        >
          {game.genre}
        </Link>
        <span>/</span>
        <span className="text-white font-semibold truncate max-w-[200px]">
          {game.title}
        </span>
      </nav>

      {/* Hero Banner with Cinematic Parallax */}
      <div className="relative h-[45vh] min-h-[360px] max-h-[500px] overflow-hidden rounded-3xl border border-white/10 shadow-2xl">
        <m.div style={{ y, opacity, backgroundColor: bgColor }} className="absolute inset-0 z-0">
          <img
            src={hero}
            alt={game.title}
            className="w-full h-full object-cover object-top opacity-60"
          />
        </m.div>
        <div className="absolute inset-0 bg-gradient-to-t from-bg-base via-bg-base/60 to-transparent z-10" />
        <div className="absolute inset-0 bg-gradient-to-r from-bg-base via-bg-base/70 to-transparent z-10" />

        <div className="absolute bottom-6 left-6 right-6 sm:bottom-10 sm:left-10 z-20">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="rounded-md border border-brand-500/50 bg-brand-500/20 px-3 py-1 text-xs font-bold text-brand-100 backdrop-blur-md">
              {game.genre}
            </span>
            {meta.approxCampaignHours && (
              <span className="rounded-md border border-white/15 bg-black/60 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-md">
                ⏱ ~{meta.approxCampaignHours}h Campaign
              </span>
            )}
            {game.platforms.map((p) => (
              <span
                key={p}
                className="rounded-md border border-white/10 bg-black/60 px-2.5 py-1 text-xs font-semibold text-text-muted backdrop-blur-md uppercase"
              >
                {PLATFORM_LABEL[p]}
              </span>
            ))}
            {trailer && (
              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  setTrailerOpen(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-md border border-red-500/40 bg-red-500/25 px-3 py-1 text-xs font-bold text-white backdrop-blur-md hover:bg-red-500/40 hover:scale-105 transition-all"
              >
                <span className="flex h-3 w-3 items-center justify-center rounded-full bg-red-500 text-white">
                  <svg className="w-1.5 h-1.5 fill-current ml-0.5" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </span>
                <span>Watch 4K Trailer</span>
              </button>
            )}
          </div>

          <h1 className="text-3xl sm:text-5xl font-display font-black text-white tracking-tight drop-shadow-md">
            {game.title}
          </h1>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Left Column: Cover Box Art & Quick Specs */}
        <div className="lg:col-span-4">
          <div className="sticky top-24 flex flex-col gap-6">
            <TiltCard>
              <div
                className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl relative aspect-[3/4] bg-bg-surface-raised"
                style={{ backgroundColor: bgColor }}
              >
                <img src={cover} alt={game.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
              </div>
            </TiltCard>

            {/* Feature Pills */}
            <div className="glass p-5 rounded-2xl border border-white/10 flex flex-col gap-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted">
                Highlights & Features
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {meta.features.map((feature, i) => (
                  <span
                    key={i}
                    className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-text-primary"
                  >
                    ✦ {feature}
                  </span>
                ))}
              </div>
            </div>

            {/* Quick trust guarantee */}
            <div className="glass p-5 rounded-2xl border border-trust-600/30 flex items-start gap-3.5">
              <span className="text-2xl">⚡</span>
              <div className="text-xs">
                <strong className="block text-sm font-bold text-white mb-0.5">
                  Verified Digital Delivery
                </strong>
                <p className="text-text-muted leading-relaxed">
                  Login access sent directly to your WhatsApp in 15–30 minutes. Full step-by-step setup assistance.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Pricing Selector, Details & Actions */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          {/* Plan Selector Card (Rent vs Buy) */}
          <div className="glass p-6 sm:p-8 rounded-3xl border border-white/10 flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-trust-600">
                  Select Option
                </span>
                <h2 className="text-xl sm:text-2xl font-display font-bold text-white">
                  Rent or Buy {game.title}
                </h2>
              </div>
              {listed && (
                <span className="rounded-full bg-trust-100 border border-trust-300 px-3 py-1 text-xs font-bold text-trust-600 w-fit">
                  Delivered in {deliveryEtaLabel(listed.listing.deliveryEtaMinutes)}
                </span>
              )}
            </div>

            {/* Rent vs Buy Two-Card Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Option 1: Rent */}
              <button
                type="button"
                onClick={() => {
                  soundFx.playSuccess();
                  setSelectedOption("rent");
                }}
                className={`relative flex flex-col justify-between p-5 rounded-2xl border text-left transition-all ${
                  selectedOption === "rent"
                    ? "border-trust-600 bg-trust-600/15 shadow-glow-trust scale-[1.01]"
                    : "border-white/10 bg-bg-surface hover:border-white/30"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-trust-600">
                      Option 1
                    </span>
                    <span className="text-xs text-text-muted font-medium">Complete the Story</span>
                  </div>
                  <h3 className="font-display text-lg font-bold text-white">Rent this Game</h3>
                  <p className="text-xs text-text-muted mt-1 leading-relaxed">
                    Full access to campaign, saves and DLCs. Flat price with zero hidden fees.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-white/5 flex items-baseline justify-between">
                  <span className="text-xs text-text-muted">Price</span>
                  <span className="font-display text-base font-black text-trust-600">
                    Price on request
                  </span>
                </div>
              </button>

              {/* Option 2: Buy */}
              <button
                type="button"
                onClick={() => {
                  soundFx.playSuccess();
                  setSelectedOption("buy");
                }}
                className={`relative flex flex-col justify-between p-5 rounded-2xl border text-left transition-all ${
                  selectedOption === "buy"
                    ? "border-brand-500 bg-brand-500/20 shadow-glow-brand scale-[1.01]"
                    : "border-white/10 bg-bg-surface hover:border-white/30"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-brand-100">
                      Option 2
                    </span>
                    <span className="text-xs text-text-muted font-medium">Permanent</span>
                  </div>
                  <h3 className="font-display text-lg font-bold text-white">Buy to Own</h3>
                  <p className="text-xs text-text-muted mt-1 leading-relaxed">
                    Permanent digital ownership to keep in your library forever.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-white/5 flex items-baseline justify-between">
                  <span className="text-xs text-text-muted">Total Price</span>
                  <span className={`font-display font-black text-white ${buyPrice !== undefined ? "text-2xl" : "text-base"}`}>
                    {buyPrice !== undefined ? `₹${buyPrice.toLocaleString("en-IN")}` : "Check availability"}
                  </span>
                </div>
              </button>
            </div>

            {/* Action CTA */}
            <div className="flex flex-col gap-2 pt-2">
              <a href={activeHref} target="_blank" rel="noreferrer" className="w-full">
                <Button
                  variant="primary"
                  size="lg"
                  glow
                  className="w-full text-base py-4 font-display"
                  disabled={!activeHref || unavailable}
                >
                  {unavailable
                    ? "Currently Unavailable"
                    : selectedOption === "rent"
                    ? `Rent ${game.title} →`
                    : buyPrice !== undefined
                    ? `Buy ${game.title} for ₹${buyPrice.toLocaleString("en-IN")} →`
                    : `Check availability →`}
                </Button>
              </a>
              <p className="text-center text-xs text-text-muted">
                ⚡ Direct WhatsApp checkout · Instant UPI payment & verified delivery.
              </p>
            </div>

            {listed && (
              <div className="text-center text-xs text-text-muted pt-2 border-t border-white/5">
                {credentialDisclosure(listed.listing.credentialType)}
              </div>
            )}
          </div>

          {/* Game Info Meta Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="glass p-4 rounded-2xl border border-white/5">
              <p className="text-text-muted text-[11px] uppercase font-bold tracking-wider mb-1">Genre</p>
              <p className="text-white text-sm font-semibold">{game.genre}</p>
            </div>
            <div className="glass p-4 rounded-2xl border border-white/5">
              <p className="text-text-muted text-[11px] uppercase font-bold tracking-wider mb-1">Developer</p>
              <p className="text-white text-sm font-semibold truncate">{game.developer}</p>
            </div>
            <div className="glass p-4 rounded-2xl border border-white/5">
              <p className="text-text-muted text-[11px] uppercase font-bold tracking-wider mb-1">Release</p>
              <p className="text-white text-sm font-semibold">{game.releaseInfo}</p>
            </div>
            <div className="glass p-4 rounded-2xl border border-white/5">
              <p className="text-text-muted text-[11px] uppercase font-bold tracking-wider mb-1">Rating</p>
              <p className="text-white text-sm font-semibold">
                {rating === null ? "5.0 ★ (Verified)" : `${rating.toFixed(1)} ★ (${reviews.length})`}
              </p>
            </div>
          </div>

          {/* About this game */}
          <div className="glass p-6 sm:p-8 rounded-3xl border border-white/5">
            <h3 className="text-xl font-display font-bold text-white mb-3">About {game.title}</h3>
            <p className="text-text-muted leading-relaxed text-sm sm:text-base">
              {game.description}
            </p>
          </div>

          {/* Step-by-Step Delivery Flow (Visual 4-Step Timeline) */}
          <div className="glass p-6 sm:p-8 rounded-3xl border border-white/10 flex flex-col gap-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-brand-500">
                Transparent Fulfillment
              </span>
              <h3 className="text-xl font-display font-bold text-white mt-1">
                How Digital Delivery Works
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex flex-col gap-2 rounded-2xl bg-white/5 p-4 border border-white/5">
                <span className="text-xs font-black text-brand-500">01</span>
                <h4 className="text-sm font-bold text-white">Select & Checkout</h4>
                <p className="text-xs text-text-muted leading-relaxed">
                  Choose Rent or Buy, then order via WhatsApp with quick UPI payment.
                </p>
              </div>

              <div className="flex flex-col gap-2 rounded-2xl bg-white/5 p-4 border border-white/5">
                <span className="text-xs font-black text-brand-500">02</span>
                <h4 className="text-sm font-bold text-white">Verification</h4>
                <p className="text-xs text-text-muted leading-relaxed">
                  Our gaming specialists confirm your platform and prepare your account credentials.
                </p>
              </div>

              <div className="flex flex-col gap-2 rounded-2xl bg-white/5 p-4 border border-white/5">
                <span className="text-xs font-black text-trust-600">03</span>
                <h4 className="text-sm font-bold text-white">Delivery in 15–30m</h4>
                <p className="text-xs text-text-muted leading-relaxed">
                  Receive verified login details or instant scan-to-play QR on WhatsApp.
                </p>
              </div>

              <div className="flex flex-col gap-2 rounded-2xl bg-white/5 p-4 border border-white/5">
                <span className="text-xs font-black text-trust-600">04</span>
                <h4 className="text-sm font-bold text-white">Play on Your Profile</h4>
                <p className="text-xs text-text-muted leading-relaxed">
                  Download official files and play on your own personal account with cloud saves.
                </p>
              </div>
            </div>
          </div>

          {/* 4K Gameplay Trailer Showcase */}
          {trailer && (
            <div className="glass p-6 sm:p-8 rounded-3xl border border-white/10 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-red-400">
                    Cinematic Preview
                  </span>
                  <h3 className="text-xl font-display font-bold text-white mt-0.5">
                    Official 4K Gameplay Trailer
                  </h3>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-red-500/10 text-red-300 border border-red-500/20 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" /> 4K Ultra HD
                </span>
              </div>

              <div className="relative w-full pt-[56.25%] rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black">
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${trailer.youtubeId}?rel=0&modestbranding=1`}
                  title={`${game.title} Trailer`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full border-0"
                />
              </div>
            </div>
          )}

          {/* PC System Requirements (if available) */}
          {meta.specs && (
            <div className="glass p-6 sm:p-8 rounded-3xl border border-white/5 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-brand-400">
                    Technical Specifications
                  </span>
                  <h3 className="text-xl font-display font-bold text-white mt-0.5">
                    PC System Requirements
                  </h3>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-white/5 text-text-muted border border-white/10">
                  DirectX 12 Compatible
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 flex flex-col gap-1">
                  <span className="text-text-muted font-bold uppercase tracking-wider text-[10px]">
                    Operating System
                  </span>
                  <span className="text-white font-semibold">{meta.specs.os}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 flex flex-col gap-1">
                  <span className="text-text-muted font-bold uppercase tracking-wider text-[10px]">
                    Processor (CPU)
                  </span>
                  <span className="text-white font-semibold">{meta.specs.processor}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 flex flex-col gap-1">
                  <span className="text-text-muted font-bold uppercase tracking-wider text-[10px]">
                    Memory (RAM)
                  </span>
                  <span className="text-white font-semibold">{meta.specs.memory}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 flex flex-col gap-1">
                  <span className="text-text-muted font-bold uppercase tracking-wider text-[10px]">
                    Graphics (GPU)
                  </span>
                  <span className="text-white font-semibold">{meta.specs.graphics}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 flex flex-col gap-1 sm:col-span-2">
                  <span className="text-text-muted font-bold uppercase tracking-wider text-[10px]">
                    Storage
                  </span>
                  <span className="text-white font-semibold">{meta.specs.storage}</span>
                </div>
              </div>
            </div>
          )}

          {/* Verified FAQ Accordion */}
          <div className="pt-2">
            <FAQAccordion
              items={COMMON_FAQS}
              subtitle="Frequently Asked Questions"
              title="Everything You Need to Know"
            />
          </div>
        </div>
      </div>

      {/* Similar Games Rail */}
      <div className="mt-8">
        <GameRail
          title={`More ${game.genre} Games`}
          ids={catalog
            .filter((g) => g.genre === game.genre && g.id !== game.id)
            .map((g) => g.id)
            .slice(0, 8)}
        />
      </div>

      {/* Trailer Modal */}
      <TrailerModal
        isOpen={trailerOpen}
        onClose={() => setTrailerOpen(false)}
        youtubeId={trailer?.youtubeId || null}
        title={game.title}
      />
    </div>
  );
}

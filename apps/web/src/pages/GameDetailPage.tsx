import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { GAME_METADATA } from "../data/gameMeta";
import { PLATFORM_LABEL, rentalPlatformsOf, type CatalogGame, type Platform } from "../data/catalogTypes";
import { getGameTrailer } from "../data/gameTrailers";
import { useStore } from "../data/store";
import { gameDescription, usePageMeta } from "../lib/pageMeta";
import { GameComments } from "../community/GameComments";
import { useShop, type CartLine } from "../shop/context";
import { OrderButtons } from "../shop/OrderButtons";
import { WishlistButton } from "../shop/WishlistButton";
import { averageRating, credentialDisclosure } from "../types/listing";
import { PlatformBadge } from "../components/Badges";
import { Badge } from "../ui/Chip";
import { Button } from "../ui/Button";
import { Notice } from "../ui/Form";
import { etaLabel, formatPrice } from "../ui/format";
import { GameCard } from "../ui/GameCard";
import { GameCover } from "../ui/GameCover";
import { IconBack, IconCheck, IconChevronDown, IconClock } from "../ui/icons";
import { Rail, Section } from "../ui/Section";
import { Stars } from "../ui/Stars";
import { TrailerPlayer } from "../ui/TrailerPlayer";
import { NotFoundPage } from "./NotFoundPage";

type Option = "buy" | "rent";

function PriceSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-busy="true" aria-label="Loading price">
      <div className="h-12 w-40 animate-pulse rounded-lg bg-border-strong/40" />
      <div className="h-4 w-56 animate-pulse rounded bg-border-strong/40" />
    </div>
  );
}

function relatedGames(game: CatalogGame, all: CatalogGame[]): CatalogGame[] {
  const others = all.filter((g) => g.id !== game.id);
  const family = others.filter((g) => g.franchise && g.franchise === game.franchise);
  const genre = others.filter((g) => g.genre && g.genre === game.genre && !family.includes(g));
  return [...family, ...genre].slice(0, 10);
}

// Collapsible section that starts open on desktop and collapsed on mobile.
function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-t border-border-strong py-5 lg:border-none lg:py-0">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 text-left lg:cursor-default lg:pointer-events-none"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <h2 className="font-display text-base font-bold text-text-primary">{title}</h2>
        <IconChevronDown className={`h-5 w-5 shrink-0 text-accent-300 transition-transform duration-200 lg:hidden ${open ? "rotate-180" : ""}`} />
      </button>
      <div className={`mt-4 ${open ? "block" : "hidden"} lg:block`}>{children}</div>
    </div>
  );
}

export function GameDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { findGame, games, findListedGame, rentalOffersFor, reviewsFor, status, reload, contactLink } = useStore();
  const shop = useShop();
  const game = id ? findGame(id) : undefined;
  usePageMeta(
    game ? `${game.title} — buy or rent` : status === "ready" ? "Page not found" : null,
    game ? gameDescription(game.title, game.description, game.platforms.map((p) => PLATFORM_LABEL[p]).join(", ")) : undefined,
  );

  const listed = game ? findListedGame(game.id) : undefined;
  const offers = game ? rentalOffersFor(game.id) : [];
  const [chosenOption, setOption] = useState<Option | null>(null);
  const [chosenPlatform, setPlatform] = useState<Platform | null>(null);
  const [planId, setPlanId] = useState<string | null>(null);
  const [showAllReviews, setShowAllReviews] = useState(false);

  const related = game ? relatedGames(game, games) : [];

  if (!game) {
    if (status === "loading") return <div className="h-96 animate-pulse rounded-2xl bg-bg-surface" aria-busy="true" aria-label="Loading" />;
    if (status === "error") return <div className="mx-auto max-w-md py-16"><Notice tone="error" onRetry={reload}>We couldn't load this game right now.</Notice></div>;
    return <NotFoundPage />;
  }
  const pricesPending = status === "loading";
  const pricesFailed = status === "error";

  const rentPlatforms = rentalPlatformsOf(game);
  const modes = game.platforms.map((p) => ({ platform: p, buy: listed?.listings.find((l) => l.platform === p), rent: rentPlatforms.includes(p) }));
  const fallback = modes.find((m) => m.buy?.isAvailable) ?? modes.find((m) => m.buy) ?? modes.find((m) => m.rent && offers.length > 0) ?? modes[0]!;
  const here = modes.find((m) => m.platform === chosenPlatform) ?? fallback;
  const platform: Platform = here.platform;
  const buyListing = here.buy;
  const option: Option = here.rent && (chosenOption === "rent" || (!buyListing && offers.length > 0)) ? "rent" : "buy";
  const plan = offers.find((o) => o.planId === planId) ?? offers.find((o) => o.isPopular) ?? offers[0];
  const reviews = reviewsFor(game.id);
  const rating = averageRating(reviews);
  const trailer = getGameTrailer(game.id);
  const meta = GAME_METADATA[game.id];
  const unavailable = buyListing !== undefined && !buyListing.isAvailable;

  const buyMessage = buyListing
    ? `Hi! I want to BUY "${game.title}" (${PLATFORM_LABEL[platform]}) for ${formatPrice(buyListing.price)}.`
    : listed ? `Hi! Is "${game.title}" available to buy on ${PLATFORM_LABEL[platform]}?` : `Hi! Is "${game.title}" available to buy?`;
  const rentMessage = plan
    ? `Hi! I want to RENT "${game.title}" on ${PLATFORM_LABEL[platform]} — ${plan.label} for ${formatPrice(plan.price)}.`
    : `Hi! I'd like to rent "${game.title}" on ${PLATFORM_LABEL[platform]}. What's the price and delivery time?`;
  const buyHref = contactLink(buyMessage);
  const rentHref = contactLink(rentMessage);

  const primary =
    pricesPending
      ? { label: "Loading price…", price: "", href: undefined, disabled: true }
      : option === "rent"
      ? { label: plan ? `Rent · ${plan.label}` : "Ask about renting", price: plan ? formatPrice(plan.price) : "Price on request", href: rentHref, disabled: false }
      : buyListing && !unavailable
        ? { label: "Buy now", price: formatPrice(buyListing.price), href: buyHref, disabled: false }
        : unavailable
          ? { label: "Currently unavailable", price: "", href: undefined, disabled: true }
          : { label: "Check availability", price: "", href: buyHref, disabled: false };

  const line: CartLine | null = !shop.ordering
    ? null
    : option === "rent"
      ? plan ? { gameId: game.id, kind: "rent", planId: plan.planId, platform } : null
      : buyListing && !unavailable ? { gameId: game.id, kind: "buy", planId: null, platform } : null;

  const facts: [string, string][] = ([
    ["Genre", game.genre],
    ["Developer", game.developer],
    ["Publisher", game.publisher],
    ["Release", game.releaseInfo],
    ["Platforms", game.platforms.map((p) => PLATFORM_LABEL[p]).join(", ")],
  ] as [string, string][]).filter(([, v]) => v && v.toLowerCase() !== "unverified");

  const heroSrc = game.heroUrl ?? game.coverUrl ?? null;
  const discountPct = buyListing?.compareAtPrice && buyListing.compareAtPrice > buyListing.price
    ? Math.round((1 - buyListing.price / buyListing.compareAtPrice) * 100)
    : null;

  return (
    <div className="flex flex-col pb-24 md:pb-0">

      {/* ── Back link ── */}
      <div className="py-2 lg:py-3">
        <Link to="/browse" className="-ml-2 inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-sm font-semibold text-text-muted hover:text-text-primary">
          <IconBack className="h-4 w-4" />
          Browse
        </Link>
      </div>

      {/* ── Mobile hero (full-bleed game art with title overlay) ── */}
      <div className="relative -mx-4 sm:-mx-6 mb-5 h-52 overflow-hidden sm:h-64 lg:hidden">
        {heroSrc ? (
          <img src={heroSrc} alt="" aria-hidden="true" loading="eager" className="h-full w-full object-cover" />
        ) : (
          <GameCover game={game} slot="hero" priority className="h-52 w-full sm:h-64" />
        )}
        {/* Bottom-to-top gradient so title is readable */}
        <div className="absolute inset-0 bg-gradient-to-t from-bg-base via-bg-base/50 to-transparent" />
        {/* Wishlist top-right */}
        <div className="absolute right-3 top-3">
          <WishlistButton gameId={game.id} title={game.title} />
        </div>
        {/* Title + badges at bottom */}
        <div className="absolute inset-x-0 bottom-0 px-4 pb-4">
          <div className="flex flex-wrap gap-1.5">
            {game.platforms.map((p) => <PlatformBadge key={p} platform={p} />)}
            {game.genre && <Badge tone="rare">{game.genre}</Badge>}
          </div>
          <h1 className="mt-2 font-display text-2xl font-bold leading-tight text-white drop-shadow-lg">{game.title}</h1>
          {rating !== null && (
            <div className="mt-1.5 flex items-center gap-2">
              <Stars value={rating} className="h-[1rem] w-[1rem]" />
              <span className="text-sm font-bold text-white">{rating.toFixed(1)}</span>
              <span className="text-xs text-white/70">{reviews.length} verified {reviews.length === 1 ? "review" : "reviews"}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Main grid: desktop left col (image+title) + purchase panel ── */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:gap-10">

        {/* Desktop: cover image + title (hidden on mobile, hero handles it) */}
        <div className="hidden lg:flex lg:flex-col lg:gap-5">
          <GameCover game={game} slot="hero" priority className="frame w-full" />
          <div>
            <div className="flex flex-wrap gap-1.5">
              {game.platforms.map((p) => <PlatformBadge key={p} platform={p} />)}
              {game.genre && <Badge tone="rare">{game.genre}</Badge>}
            </div>
            <div className="mt-3 flex items-start justify-between gap-3">
              <h1 className="font-display text-3xl font-bold leading-tight text-text-primary sm:text-4xl">{game.title}</h1>
              <WishlistButton gameId={game.id} title={game.title} />
            </div>
            {rating !== null && (
              <div className="mt-2 flex items-center gap-2">
                <Stars value={rating} className="h-[1.125rem] w-[1.125rem]" />
                <span className="font-semibold text-text-primary">{rating.toFixed(1)}</span>
                <span className="text-sm text-text-muted">({reviews.length} verified {reviews.length === 1 ? "review" : "reviews"})</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Purchase panel ── */}
        <aside className="lg:sticky lg:top-24 lg:self-start" aria-label="Buy or rent">
          <div className="panel hud flex flex-col gap-4 p-4 sm:p-5">

            {/* Platform selector */}
            {modes.length > 1 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">Platform</p>
                <div role="radiogroup" aria-label="Platform" className="grid grid-cols-3 gap-2">
                  {modes.map((m) => (
                    <button
                      key={m.platform}
                      type="button"
                      role="radio"
                      aria-checked={m.platform === platform}
                      onClick={() => { setPlatform(m.platform); setOption(null); }}
                      className={`chip cut flex min-h-14 flex-col items-center justify-center px-2 py-1.5 transition-all ${m.platform === platform ? "chip-on" : "opacity-70 hover:opacity-100"}`}
                    >
                      <span className="font-display text-sm font-bold leading-tight">{PLATFORM_LABEL[m.platform]}</span>
                      <span className="mt-0.5 text-[11px] opacity-80">{m.buy && m.rent ? "Buy or rent" : m.buy ? "Permanent" : m.rent ? "Rental" : "Ask us"}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Buy / Rent toggle */}
            {buyListing && here.rent && (
              <div role="tablist" aria-label="Buy or rent" className="grid grid-cols-2 gap-2">
                {(["buy", "rent"] as const).map((o) => (
                  <button
                    key={o}
                    type="button"
                    role="tab"
                    aria-selected={option === o}
                    onClick={() => setOption(o)}
                    className={`chip cut min-h-11 font-display text-base font-bold ${option === o ? "chip-on" : ""}`}
                  >
                    {o === "buy" ? "Buy (permanent)" : "Rent"}
                  </button>
                ))}
              </div>
            )}

            {/* Price + details for selected option */}
            {option === "buy" ? (
              <div className="flex flex-col gap-3">
                {buyListing ? (
                  <>
                    {/* Price row */}
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="price-tag cut cut-tag py-1 pl-5 pr-4 text-4xl [--cut:14px]">{formatPrice(buyListing.price)}</span>
                      {buyListing.compareAtPrice && buyListing.compareAtPrice > buyListing.price && (
                        <div className="flex flex-col">
                          <span className="text-sm text-text-muted line-through">{formatPrice(buyListing.compareAtPrice)}</span>
                          {discountPct && <span className="text-xs font-bold text-trust-400">{discountPct}% off</span>}
                        </div>
                      )}
                    </div>
                    {/* Delivery + type chips */}
                    <div className="flex flex-wrap gap-2">
                      <span className="trust-pill">
                        <IconClock className="h-3.5 w-3.5" />
                        Delivered in {etaLabel(buyListing.deliveryEtaMinutes)}
                      </span>
                      <span className="trust-pill">{PLATFORM_LABEL[platform]} · yours to keep</span>
                    </div>
                    <p className="text-sm text-text-muted">{credentialDisclosure(buyListing.credentialType)}</p>
                    {/* What you get */}
                    <ul className="value-panel flex flex-col gap-1.5 p-3 text-xs font-semibold text-trust-600">
                      <li className="flex items-center gap-2">
                        <IconCheck className="h-4 w-4 shrink-0" />
                        Access delivered to your order page
                      </li>
                      <li className="flex items-center gap-2">
                        <IconCheck className="h-4 w-4 shrink-0" />
                        Official {PLATFORM_LABEL[platform]} download
                      </li>
                    </ul>
                  </>
                ) : pricesPending ? (
                  <PriceSkeleton />
                ) : pricesFailed ? (
                  <Notice tone="error" onRetry={reload}>We couldn't load the price just now.</Notice>
                ) : (
                  <p className="text-sm text-text-muted">{listed ? `This game isn't listed for ${PLATFORM_LABEL[platform]} yet.` : "This game isn't listed with a price yet."} Message us and we'll check.</p>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {offers.length > 0 && platform === "pc" && (
                  <p className="text-sm font-semibold text-text-primary">Steam Online</p>
                )}
                {offers.length > 0 ? (
                  <div role="radiogroup" aria-label="Rental length" className="grid grid-cols-2 gap-2">
                    {offers.map((o) => (
                      <button
                        key={o.planId}
                        type="button"
                        role="radio"
                        aria-checked={plan?.planId === o.planId}
                        onClick={() => setPlanId(o.planId)}
                        className="option cut relative flex min-h-16 flex-col items-start justify-center px-3 py-2 text-left"
                      >
                        <span className="text-sm font-bold text-text-primary">{o.label}</span>
                        <span className="font-display text-lg font-bold text-trust-600">{formatPrice(o.price)}</span>
                        {(o.isPopular || o.tag) && <span className="absolute right-3 top-1.5 rounded-[3px] bg-trust-600 px-1.5 text-xs font-bold text-black">{o.tag ?? "Popular"}</span>}
                      </button>
                    ))}
                  </div>
                ) : pricesPending ? (
                  <PriceSkeleton />
                ) : pricesFailed ? (
                  <Notice tone="error" onRetry={reload}>We couldn't load the rental prices just now.</Notice>
                ) : (
                  <p className="text-sm text-text-muted">Rental prices for this game aren't set yet. Message us for the price and how quickly we can deliver.</p>
                )}
                <p className="text-sm text-text-muted">You rent the {PLATFORM_LABEL[platform]} version; the time starts when we deliver it.</p>
              </div>
            )}

            {/* CTA button */}
            <div>
              {line ? (
                <OrderButtons line={line} label={`${primary.label} · ${primary.price}`} />
              ) : (
                <Button href={primary.href} disabled={primary.disabled} size="lg" full>
                  {primary.label}{primary.price ? ` · ${primary.price}` : ""}
                </Button>
              )}
            </div>
            {!line && !primary.href && !primary.disabled && (
              <p className="text-xs text-text-muted">Contact details aren't set up yet.</p>
            )}
          </div>
        </aside>
      </div>

      {/* ── Content sections ── */}
      <div className="mt-2 lg:mt-8">

        {/* About this game */}
        {game.description && (
          <DetailSection title="About this game">
            <p className="max-w-prose text-sm leading-relaxed text-text-muted sm:text-base">{game.description}</p>
          </DetailSection>
        )}

        {/* Game details */}
        {facts.length > 0 && (
          <DetailSection title="Game details">
            <dl className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {facts.map(([k, v]) => (
                <div key={k} className="panel p-3">
                  <dt className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">{k}</dt>
                  <dd className="mt-1 text-sm font-semibold text-text-primary">{v}</dd>
                </div>
              ))}
            </dl>
          </DetailSection>
        )}

        {/* Good to know / features */}
        {meta && (
          <DetailSection title="Good to know">
            <div className="flex flex-col gap-3">
              <ul className="flex flex-wrap gap-2">
                {meta.features.map((f) => <li key={f} className="badge badge-neutral cut px-3 py-1.5 text-sm font-normal text-text-muted">{f}</li>)}
              </ul>
              {meta.approxCampaignHours && (
                <p className="text-sm text-text-muted">Main story takes roughly <span className="font-semibold text-text-primary">{meta.approxCampaignHours} hours</span>.</p>
              )}
              {meta.specs && (
                <details className="group panel">
                  <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-4 text-sm font-semibold text-text-primary">
                    PC system requirements
                    <IconChevronDown className="h-5 w-5 text-accent-300 transition-transform group-open:rotate-180" />
                  </summary>
                  <dl className="grid gap-2 px-4 pb-4 text-sm sm:grid-cols-2">
                    {Object.entries(meta.specs).map(([k, v]) => (
                      <div key={k}><dt className="text-xs uppercase tracking-wider text-text-muted">{k}</dt><dd className="text-text-primary">{v}</dd></div>
                    ))}
                  </dl>
                </details>
              )}
            </div>
          </DetailSection>
        )}

        {/* Trailer */}
        {trailer && (
          <DetailSection title="Trailer">
            <TrailerPlayer youtubeId={trailer.youtubeId} title={trailer.title} poster={<GameCover game={game} slot="hero" className="w-full" />} />
          </DetailSection>
        )}

        {/* Reviews */}
        <div className="border-t border-border-strong py-5 lg:border-none lg:py-0 lg:mt-8">
          <h2 className="font-display text-base font-bold text-text-primary">
            Reviews
            {reviews.length > 0 && <span className="ml-2 text-sm font-normal text-text-muted">({reviews.length})</span>}
          </h2>
          <div className="mt-4">
            {reviews.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border-strong px-4 py-8 text-center">
                <p className="text-sm text-text-muted">No reviews yet.</p>
                <p className="mt-1 text-xs text-text-muted">Reviews come only from customers who received this game.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {(showAllReviews ? reviews : reviews.slice(0, 4)).map((r) => (
                  <div key={r.id} className="panel p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-600 font-display text-sm font-bold text-white">
                        {(r.reviewerName ?? "V")[0]?.toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-text-primary">{r.reviewerName ?? "Verified customer"}</span>
                          <span className="flex shrink-0" aria-label={`${r.rating} out of 5`}>
                            <Stars value={r.rating} />
                          </span>
                        </div>
                        <p className="mt-1.5 text-sm text-text-muted">{r.comment}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {reviews.length > 4 && !showAllReviews && (
                  <Button variant="secondary" onClick={() => setShowAllReviews(true)}>
                    Show all {reviews.length} reviews
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Comments */}
        <div className="border-t border-border-strong py-5 lg:border-none lg:py-0 lg:mt-6">
          <GameComments gameId={game.id} />
        </div>
      </div>

      {/* More like this */}
      {related.length > 0 && (
        <div className="mt-2">
          <Section title="More like this">
            <Rail label="More like this">
              {related.map((g) => (
                <div key={g.id} className="w-36 shrink-0 snap-start sm:w-44"><GameCard game={g} /></div>
              ))}
            </Rail>
          </Section>
        </div>
      )}

      {/* Phone sticky buy bar */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border-strong bg-bg-base/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl before:absolute before:inset-x-6 before:top-0 before:h-px before:bg-linear-to-r before:from-transparent before:via-accent-400 before:to-transparent md:hidden">
        <div className="mx-auto flex max-w-xl items-center gap-3">
          {primary.price && !primary.disabled && (
            <div className="min-w-0 shrink-0">
              <p className="text-xs text-text-muted">{option === "rent" ? "Rent" : "Price"}</p>
              <p className="font-display text-lg font-bold leading-tight text-text-primary">{primary.price}</p>
            </div>
          )}
          {line
            ? <div className="min-w-0 flex-1"><OrderButtons line={line} label={primary.label} compact /></div>
            : <Button href={primary.href} disabled={primary.disabled} size="lg" full>{primary.label}</Button>
          }
        </div>
      </div>
    </div>
  );
}

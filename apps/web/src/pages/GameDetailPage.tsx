import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { GAME_METADATA } from "../data/gameMeta";
import { PLATFORM_LABEL, type CatalogGame, type Platform } from "../data/catalogTypes";
import { getGameTrailer } from "../data/gameTrailers";
import { PROMISE } from "../data/policies";
import { useStore } from "../data/store";
import { gameDescription, usePageMeta } from "../lib/pageMeta";
import { GameComments } from "../community/GameComments";
import { useShop, type CartLine } from "../shop/context";
import { OrderButtons } from "../shop/OrderButtons";
import { WishlistButton } from "../shop/WishlistButton";
import { averageRating, credentialDisclosure } from "../types/listing";
import { PlatformBadge } from "../components/Badges";
import { Badge, Chip } from "../ui/Chip";
import { Button } from "../ui/Button";
import { Notice } from "../ui/Form";
import { etaLabel, formatPrice } from "../ui/format";
import { GameCard } from "../ui/GameCard";
import { GameCover } from "../ui/GameCover";
import { IconBack, IconChevronDown, IconClock, IconShield } from "../ui/icons";
import { Rail, Section } from "../ui/Section";
import { Stars } from "../ui/Stars";
import { TrailerPlayer } from "../ui/TrailerPlayer";
import { NotFoundPage } from "./NotFoundPage";

// The game page, phone first: a compact banner, then the price and the Buy / Rent choice straight
// away, and a sticky bar that keeps the main action within thumb reach. Facts come from the database
// (or the built-in list); a field that is empty is simply not shown — nothing is invented.

type Option = "buy" | "rent";

// Holds the price's place while the database answers, so the panel doesn't briefly claim the game has no price.
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
  const [planId, setPlanId] = useState<string | null>(null);
  const [rentPlatform, setRentPlatform] = useState<Platform | null>(null);
  const [showAllReviews, setShowAllReviews] = useState(false);

  const related = game ? relatedGames(game, games) : [];

  if (!game) {
    if (status === "loading") return <div className="h-96 animate-pulse rounded-2xl bg-bg-surface" aria-busy="true" aria-label="Loading" />;
    // The built-in list may lack a game the owner added, so a failed load can't say "not found" for certain.
    if (status === "error") return <div className="mx-auto max-w-md py-16"><Notice tone="error" onRetry={reload}>We couldn’t load this game right now.</Notice></div>;
    return <NotFoundPage />;
  }
  const pricesPending = status === "loading";
  const pricesFailed = status === "error";

  const option: Option = chosenOption ?? (listed ? "buy" : offers.length ? "rent" : "buy");
  const plan = offers.find((o) => o.planId === planId) ?? offers.find((o) => o.isPopular) ?? offers[0];
  const platform = rentPlatform ?? game.platforms[0];
  const reviews = reviewsFor(game.id);
  const rating = averageRating(reviews);
  const trailer = getGameTrailer(game.id);
  const meta = GAME_METADATA[game.id];
  const unavailable = listed !== undefined && !listed.listing.isAvailable;

  const buyMessage = listed
    ? `Hi! I want to BUY "${game.title}" (${PLATFORM_LABEL[listed.listing.platform]}) for ${formatPrice(listed.listing.price)}.`
    : `Hi! Is "${game.title}" available to buy?`;
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
      : listed && !unavailable
        ? { label: "Buy now", price: formatPrice(listed.listing.price), href: buyHref, disabled: false }
        : unavailable
          ? { label: "Currently unavailable", price: "", href: undefined, disabled: true }
          : { label: "Check availability", price: "", href: buyHref, disabled: false };

  // With online ordering on, a priced and available choice goes in the cart; anything else (no price yet,
  // sold out, no plan set) keeps the chat / disabled action above.
  const line: CartLine | null = !shop.ordering
    ? null
    : option === "rent"
      ? plan ? { gameId: game.id, kind: "rent", planId: plan.planId, platform } : null
      : listed && !unavailable ? { gameId: game.id, kind: "buy", planId: null, platform: null } : null;

  const facts: [string, string][] = ([
    ["Genre", game.genre],
    ["Developer", game.developer],
    ["Publisher", game.publisher],
    ["Release", game.releaseInfo],
    ["Platforms", game.platforms.map((p) => PLATFORM_LABEL[p]).join(", ")],
  ] as [string, string][]).filter(([, v]) => v && v.toLowerCase() !== "unverified");

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <div className="-mb-2">
        <Link to="/browse" className="-ml-2 inline-flex min-h-11 items-center gap-1 rounded-lg px-2 text-sm font-semibold text-text-muted hover:text-text-primary">
          <IconBack className="h-5 w-5" />
          Browse
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-10">
        <div className="flex min-w-0 flex-col gap-6">
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
              <p className="mt-2 flex items-center gap-2 text-sm text-text-muted">
                <Stars value={rating} className="h-[1.125rem] w-[1.125rem]" />
                <span className="font-semibold text-text-primary">{rating.toFixed(1)}</span>
                <span>({reviews.length} verified {reviews.length === 1 ? "review" : "reviews"})</span>
              </p>
            )}
          </div>
        </div>

        {/* Purchase panel: right after the title on a phone, sticky beside the content on desktop */}
        <aside className="lg:sticky lg:top-24 lg:self-start" aria-label="Buy or rent">
          <div className="panel hud flex flex-col gap-4 p-4 sm:p-5">
            {listed && offers.length > 0 && (
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
                    {o === "buy" ? "Buy" : "Rent"}
                  </button>
                ))}
              </div>
            )}

            {option === "buy" ? (
              <div className="flex flex-col gap-3">
                {listed ? (
                  <>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="price-tag cut cut-tag py-1 pl-5 pr-4 text-4xl [--cut:14px]">{formatPrice(listed.listing.price)}</span>
                      {listed.listing.compareAtPrice && listed.listing.compareAtPrice > listed.listing.price && (
                        <span className="text-base text-text-muted line-through">{formatPrice(listed.listing.compareAtPrice)}</span>
                      )}
                    </div>
                    <p className="flex items-center gap-2 text-sm text-text-muted">
                      <IconClock className="h-5 w-5 shrink-0 text-trust-600" />
                      Delivered in {etaLabel(listed.listing.deliveryEtaMinutes)} · {PLATFORM_LABEL[listed.listing.platform]}
                    </p>
                    <p className="text-sm text-text-muted">{credentialDisclosure(listed.listing.credentialType)}</p>
                  </>
                ) : pricesPending ? (
                  <PriceSkeleton />
                ) : pricesFailed ? (
                  <Notice tone="error" onRetry={reload}>We couldn’t load the price just now.</Notice>
                ) : (
                  <p className="text-sm text-text-muted">This game isn’t listed with a price yet. Message us and we’ll check whether we can get it for you, and how quickly.</p>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {offers.length > 0 ? (
                  <>
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
                  </>
                ) : pricesPending ? (
                  <PriceSkeleton />
                ) : pricesFailed ? (
                  <Notice tone="error" onRetry={reload}>We couldn’t load the rental prices just now.</Notice>
                ) : (
                  <p className="text-sm text-text-muted">Rental prices for this game aren’t set yet. Message us for the price and how quickly we can deliver.</p>
                )}
                {game.platforms.length > 1 && (
                  <div>
                    <p className="mb-1.5 text-sm font-semibold text-text-primary">Platform</p>
                    <div className="flex flex-wrap gap-2">
                      {game.platforms.map((p) => <Chip key={p} selected={platform === p} onClick={() => setRentPlatform(p)}>{PLATFORM_LABEL[p]}</Chip>)}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="hidden md:block">
              {line ? (
                <OrderButtons line={line} label={`${primary.label} · ${primary.price}`} />
              ) : (
                <Button href={primary.href} disabled={primary.disabled} size="lg" full>
                  {primary.label}{primary.price ? ` · ${primary.price}` : ""}
                </Button>
              )}
            </div>
            {!line && !primary.href && !primary.disabled && <p className="text-xs text-text-muted">Contact details aren’t set up yet.</p>}

            <div className="flex items-center gap-3 rounded-xl border border-trust-300 bg-trust-100 p-3 text-sm text-text-muted">
              <span className="medal cut cut-hex h-10 w-10"><IconShield className="h-5 w-5" /></span>
              <p>
                <span className="font-semibold text-text-primary">Replacement guarantee.</span>{" "}
                {option === "rent" ? "Something off during your rental? We replace it, free." : `Something off in the ${PROMISE.replacementDays} days after delivery? We replace it, free.`}
              </p>
            </div>
          </div>
        </aside>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-10">
        <div className="flex min-w-0 flex-col gap-8">
          {game.description && (
            <Section title="About this game">
              <p className="max-w-prose text-base leading-relaxed text-text-muted">{game.description}</p>
            </Section>
          )}

          {facts.length > 0 && (
            <Section title="Details">
              <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {facts.map(([k, v]) => (
                  <div key={k} className="panel p-3">
                    <dt className="text-xs font-semibold uppercase tracking-wider text-text-muted">{k}</dt>
                    <dd className="mt-1 text-sm font-semibold text-text-primary">{v}</dd>
                  </div>
                ))}
              </dl>
            </Section>
          )}

          {meta && (
            <Section title="Good to know">
              <ul className="flex flex-wrap gap-2">
                {meta.features.map((f) => <li key={f} className="badge badge-neutral cut px-3 py-1.5 text-sm font-normal text-text-muted">{f}</li>)}
              </ul>
              {meta.approxCampaignHours && <p className="text-sm text-text-muted">Main story takes roughly {meta.approxCampaignHours} hours.</p>}
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
            </Section>
          )}

          {trailer && (
            <Section title="Trailer">
              <TrailerPlayer youtubeId={trailer.youtubeId} title={trailer.title} poster={<GameCover game={game} slot="hero" className="w-full" />} />
            </Section>
          )}

          <Section title="Reviews">
            {reviews.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border-strong px-4 py-8 text-center text-sm text-text-muted">No reviews yet. Reviews here come only from customers who received this game.</p>
            ) : (
              <>
                <ul className="flex flex-col gap-3">
                  {(showAllReviews ? reviews : reviews.slice(0, 4)).map((r) => (
                    <li key={r.id} className="panel p-4">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-semibold text-text-primary">{r.reviewerName ?? "Verified customer"}</span>
                        <span className="flex" aria-label={`${r.rating} out of 5`}>
                          <Stars value={r.rating} />
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-text-muted">{r.comment}</p>
                    </li>
                  ))}
                </ul>
                {reviews.length > 4 && !showAllReviews && <Button variant="secondary" onClick={() => setShowAllReviews(true)}>Show all {reviews.length} reviews</Button>}
              </>
            )}
          </Section>

          <GameComments gameId={game.id} />
        </div>
      </div>

      {related.length > 0 && (
        <Section title="More like this">
          <Rail label="More like this">
            {related.map((g) => (
              <div key={g.id} className="w-36 shrink-0 snap-start sm:w-44"><GameCard game={g} /></div>
            ))}
          </Rail>
        </Section>
      )}

      {/* Phone: the main action stays in reach. Desktop uses the button in the panel above. */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border-strong bg-bg-base/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl before:absolute before:inset-x-6 before:top-0 before:h-px before:bg-linear-to-r before:from-transparent before:via-accent-400 before:to-transparent md:hidden">
        <div className="mx-auto flex max-w-xl items-center gap-3">
          {primary.price && !primary.disabled && (
            <div className="min-w-0 shrink-0">
              <p className="text-xs text-text-muted">{option === "rent" ? "Rent" : "Price"}</p>
              <p className="font-display text-lg font-bold leading-tight text-text-primary">{primary.price}</p>
            </div>
          )}
          {line ? <div className="min-w-0 flex-1"><OrderButtons line={line} label={primary.label} compact /></div> : <Button href={primary.href} disabled={primary.disabled} size="lg" full>{primary.label}</Button>}
        </div>
      </div>
    </div>
  );
}

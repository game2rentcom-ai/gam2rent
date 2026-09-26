import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PlatformGlyph } from "../components/Badges";
import { Suggestions } from "../community/Suggestions";
import { useRequestLink } from "../community/request";
import { useShop } from "../shop/context";
import { PLATFORM_LABEL, type CatalogGame, type Platform } from "../data/catalogTypes";
import { useStore } from "../data/store";
import { averageRating } from "../types/listing";
import { Button } from "../ui/Button";
import { PLATFORM_SHORT, etaLabel, formatPrice, platformLine } from "../ui/format";
import { GameCard } from "../ui/GameCard";
import { GameCover } from "../ui/GameCover";
import { IconChat, IconClock, IconShield, IconStar } from "../ui/icons";
import { Rail, Section } from "../ui/Section";
import { SearchPanel } from "../ui/SearchPanel";

// Home: short and purposeful on a phone. Everything shown is real — counts and delivery times are
// computed from the store's data, and a block with nothing to say (no listings, no reviews yet)
// simply doesn't appear.

// Editorial picks (not sales claims): shown only if the game exists in the store.
const SPOTLIGHT_IDS = ["gta-5", "cyberpunk-2077", "black-myth-wukong", "elden-ring", "spider-man-2", "god-of-war"];
const FAVOURITE_IDS = ["gta-5", "red-dead-redemption-2", "cyberpunk-2077", "elden-ring", "the-witcher-3", "god-of-war", "ghost-of-tsushima", "forza-horizon-5"];
const NEW_IDS = ["silent-hill-2", "dragon-ball-sparking-zero", "marvel-rivals", "ea-sports-fc", "astro-bot", "tekken", "call-of-duty"];
const PLATFORMS = Object.keys(PLATFORM_LABEL) as Platform[];

const FAQS = [
  { q: "How does it work?", a: "Pick a game and choose Buy or Rent, then confirm with us. We send you the login details for an account that has the game (or a scan-to-play code, depending on the game). You sign in on your console or PC, download the game from the official store, and play." },
  { q: "Is this an account or a code?", a: "You get access to an account that has the game — or a QR code that signs you in — not a redeemable key. Each game page says exactly which, before you pay." },
  { q: "What if something goes wrong?", a: "Accounts shared this way can occasionally be restricted or reclaimed by the platform. If anything goes wrong after delivery, we replace it, free. Keep the login details private." },
  { q: "How long does delivery take?", a: "Each game page shows the delivery time for that game. We deliver on demand, so a game we don’t already hold can take a little longer — the page tells you before you commit." },
  { q: "Renting or buying — what’s the difference?", a: "Renting gives you access for a set number of days, then it ends. Buying gives you access with no end date, covered by our replacement guarantee. The price for each is on the game’s page." },
  { q: "Can I extend a rental?", a: "Message us before your rental ends and we’ll tell you the options." },
];

// The first answer once online ordering is on (the list above describes ordering by message).
const ORDERING_ANSWER = "Pick a game, choose Buy or Rent and pay securely online. When your account is ready, its login details (or a scan-to-play code, depending on the game) appear on your order page. You sign in on your console or PC, download the game from the official store, and play.";

function median(numbers: number[]): number {
  const s = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
}

function pick(ids: string[], find: (id: string) => CatalogGame | undefined): CatalogGame[] {
  return ids.map(find).filter((g): g is CatalogGame => Boolean(g));
}

export function HomePage() {
  const { games, findGame, listedGames, reviews, status, contactLink } = useStore();
  const [query, setQuery] = useState("");
  const chatHref = contactLink("Hi! I have a question about renting or buying games.");
  const request = useRequestLink();
  const { ordering } = useShop();
  const faqs = ordering ? [{ ...FAQS[0], a: ORDERING_ANSWER }, ...FAQS.slice(1)] : FAQS;

  const spotlight = useMemo(() => {
    const featured = listedGames.filter((g) => g.listing.isFeatured && g.listing.isAvailable);
    const rest = pick(SPOTLIGHT_IDS, findGame).filter((g) => !featured.some((f) => f.id === g.id));
    return [...featured, ...rest].slice(0, 6);
  }, [listedGames, findGame]);

  const availableNow = listedGames.filter((g) => g.listing.isAvailable);
  const favourites = pick(FAVOURITE_IDS, findGame);
  const fresh = pick(NEW_IDS, findGame);
  const platformCounts = PLATFORMS.map((p) => ({ p, n: games.filter((g) => g.platforms.includes(p)).length })).filter((x) => x.n > 0);

  const rating = averageRating(reviews);
  const typicalEta = availableNow.length ? median(availableNow.map((g) => g.listing.deliveryEtaMinutes)) : null;

  return (
    <div className="flex flex-col gap-12 sm:gap-16">
      <section className="flex flex-col items-center gap-5 pt-2 text-center sm:pt-6">
        <p className="rounded-full border border-brand-500/40 bg-brand-500/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-brand-100">Buy or rent digital games</p>
        <h1 className="max-w-3xl font-display text-4xl font-black leading-[1.05] tracking-tight text-text-primary sm:text-5xl lg:text-6xl">
          Find your next game. <span className="text-gradient">Play it today.</span>
        </h1>
        <p className="max-w-xl text-base text-text-muted sm:text-lg">PC, PlayStation, Xbox and cloud gaming — with a delivery time you can see up front, and a free replacement if anything goes wrong.</p>
        <div className="w-full max-w-xl text-left">
          <SearchPanel query={query} onQuery={setQuery} onDone={() => setQuery("")} dropdown placeholder={`Search ${games.length} games`} />
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {PLATFORMS.map((p) => (
            <Link key={p} to={`/browse?platform=${p}`} className="inline-flex min-h-10 shrink-0 items-center rounded-full border border-border-subtle bg-bg-surface px-4 text-sm font-medium text-text-muted hover:border-white/30 hover:text-text-primary">
              {PLATFORM_LABEL[p]}
            </Link>
          ))}
        </div>
      </section>

      {spotlight.length > 0 && (
        <Section title="Spotlight" moreTo="/browse" moreLabel="Browse all">
          <Rail label="Spotlight games">
            {spotlight.map((g, i) => {
              const listed = listedGames.find((l) => l.id === g.id);
              return (
                <Link
                  key={g.id}
                  to={`/games/${g.id}`}
                  className="group relative w-[82vw] max-w-md shrink-0 snap-start overflow-hidden rounded-2xl border border-white/10 sm:w-96"
                >
                  <GameCover game={g} slot="hero" priority={i === 0} sizes="(min-width: 640px) 384px, 82vw" className="w-full" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" aria-hidden="true" />
                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-white/80">{platformLine(g.platforms)}</p>
                      <h3 className="line-clamp-2 font-display text-lg font-black leading-tight text-white">{g.title}</h3>
                    </div>
                    <span className="shrink-0 rounded-full bg-brand-500 px-3 py-1.5 text-sm font-bold text-white">
                      {listed && listed.listing.isAvailable ? formatPrice(listed.listing.price) : "View"}
                    </span>
                  </div>
                </Link>
              );
            })}
          </Rail>
        </Section>
      )}

      {availableNow.length > 0 && (
        <Section title="Available now" eyebrow="Ready to deliver" moreTo="/browse?forsale=1">
          <Rail label="Games available now">
            {availableNow.slice(0, 10).map((g) => <div key={g.id} className="w-36 shrink-0 snap-start sm:w-44"><GameCard game={g} /></div>)}
          </Rail>
        </Section>
      )}

      <Suggestions />

      {favourites.length > 0 && (
        <Section title="Fan favourites" moreTo="/browse">
          <Rail label="Fan favourite games">
            {favourites.map((g) => <div key={g.id} className="w-36 shrink-0 snap-start sm:w-44"><GameCard game={g} /></div>)}
          </Rail>
        </Section>
      )}

      {fresh.length > 0 && (
        <Section title="New & upcoming" moreTo="/browse">
          <Rail label="New and upcoming games">
            {fresh.map((g) => <div key={g.id} className="w-36 shrink-0 snap-start sm:w-44"><GameCard game={g} /></div>)}
          </Rail>
        </Section>
      )}

      <Section title="Browse by platform">
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {platformCounts.map(({ p, n }, i) => (
            <li key={p} className={i === platformCounts.length - 1 && platformCounts.length % 2 === 1 ? "col-span-2 sm:col-span-1" : ""}>
              <Link to={`/browse?platform=${p}`} className="flex min-h-20 items-center gap-3 rounded-2xl border border-white/10 bg-bg-surface p-4 transition-colors hover:border-brand-500/50 active:bg-bg-surface-raised">
                <PlatformGlyph platform={p} className="h-8 w-8 shrink-0 text-brand-500" />
                <span className="min-w-0">
                  <span className="block truncate font-display text-base font-bold text-text-primary">{PLATFORM_SHORT[p]}</span>
                  <span className="block text-xs text-text-muted">{n} games</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="How it works">
        <ol className="grid gap-3 sm:grid-cols-3">
          {(ordering
            ? [
                ["1", "Choose a game", "Buy it or rent it. The price and delivery time are on the game’s page."],
                ["2", "Pay online", "Add it to your cart and pay securely. We get your game ready."],
                ["3", "Sign in and play", "Your login details appear on your order page. Sign in, download from the official store, play."],
              ]
            : [
                ["1", "Choose a game", "Buy it or rent it. The price and delivery time are on the game’s page."],
                ["2", "Confirm with us", "Message us to confirm and pay. We get your game ready."],
                ["3", "Sign in and play", "We send your login details. Sign in, download from the official store, play."],
              ]
          ).map(([n, t, d]) => (
            <li key={n} className="flex gap-4 rounded-2xl border border-white/10 bg-bg-surface p-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-500 font-display text-lg font-black text-white">{n}</span>
              <div>
                <h3 className="font-display text-base font-bold text-text-primary">{t}</h3>
                <p className="mt-1 text-sm text-text-muted">{d}</p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <section aria-label="Why GameBuy" className="grid gap-3 sm:grid-cols-3">
        <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-bg-surface p-4">
          <IconShield className="h-6 w-6 shrink-0 text-trust-600" />
          <p className="text-sm text-text-muted"><span className="block font-semibold text-text-primary">Free replacement</span>Something off after delivery? We replace it.</p>
        </div>
        {typicalEta !== null && (
          <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-bg-surface p-4">
            <IconClock className="h-6 w-6 shrink-0 text-trust-600" />
            <p className="text-sm text-text-muted"><span className="block font-semibold text-text-primary">Typical delivery {etaLabel(typicalEta)}</span>Based on the games available right now.</p>
          </div>
        )}
        {rating !== null && (
          <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-bg-surface p-4">
            <IconStar className="h-6 w-6 shrink-0 text-rating-gold" />
            <p className="text-sm text-text-muted"><span className="block font-semibold text-text-primary">{rating.toFixed(1)} from {reviews.length} verified {reviews.length === 1 ? "review" : "reviews"}</span>From customers who received their game.</p>
          </div>
        )}
      </section>

      <Section title="Questions">
        <div className="flex flex-col gap-2">
          {faqs.map((f) => (
            <details key={f.q} className="group rounded-2xl border border-white/10 bg-bg-surface">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-4 py-2 text-left text-base font-semibold text-text-primary">
                {f.q}
                <span className="shrink-0 text-text-muted transition-transform group-open:rotate-180" aria-hidden="true">▾</span>
              </summary>
              <p className="px-4 pb-4 text-sm leading-relaxed text-text-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </Section>

      <section className="flex flex-col items-center gap-3 rounded-3xl border border-brand-500/30 bg-brand-500/10 px-6 py-10 text-center">
        <h2 className="font-display text-2xl font-black text-text-primary">Can’t find a game?</h2>
        <p className="max-w-md text-sm text-text-muted">Tell us what you want to play and we’ll try to get it.</p>
        <div className="flex flex-wrap justify-center gap-2 pt-1">
          <Button {...request}>Request a game</Button>
          <Button href={chatHref} variant="secondary"><IconChat className="h-5 w-5" />Message us</Button>
        </div>
      </section>

      {status === "loading" && <p className="sr-only" aria-live="polite">Loading the latest games and prices…</p>}
    </div>
  );
}

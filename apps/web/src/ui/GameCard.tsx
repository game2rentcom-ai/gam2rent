import { Link } from "react-router-dom";
import { PlatformLine } from "../components/Badges";
import type { CatalogGame } from "../data/catalogTypes";
import { useStore } from "../data/store";
import { averageRating } from "../types/listing";
import { GameCover } from "./GameCover";
import { IconStar } from "./icons";
import { formatPrice } from "./format";

// The one game card, used in every grid and rail so games look the same everywhere. Layout is a
// picture, then text below it — nothing is drawn over the picture that could collide on a small card.
interface Props {
  game: CatalogGame;
  /** a control pinned to the picture's top-right corner (e.g. the wishlist heart) */
  actions?: React.ReactNode;
  /** the first cards on a page are visible immediately; the rest load lazily */
  priority?: boolean;
  className?: string;
}

export function GameCard({ game, actions, priority = false, className = "" }: Props) {
  const { findListedGame, rentalOffersFor, reviewsFor } = useStore();
  const listed = findListedGame(game.id);
  const offers = rentalOffersFor(game.id);
  const rating = averageRating(reviewsFor(game.id));
  const cheapestRent = offers.length ? Math.min(...offers.map((o) => o.price)) : undefined;
  const unavailable = listed !== undefined && !listed.listing.isAvailable;

  return (
    <article className={`group relative flex min-w-0 flex-col gap-2 ${className}`}>
      <Link to={`/games/${game.id}`} className="flex flex-col gap-2.5 rounded-lg focus-visible:outline-offset-4">
        <GameCover game={game} slot="card" priority={priority} className="frame transition-transform duration-300 group-hover:-translate-y-0.5">
          {unavailable && (
            <span className="absolute inset-x-0 bottom-0 bg-black/70 py-1.5 text-center text-xs font-semibold text-text-primary">Currently unavailable</span>
          )}
        </GameCover>
        <div className="min-w-0 px-0.5">
          <h3 className="line-clamp-2 min-h-10 font-display text-sm font-bold leading-5 text-text-primary">{game.title}</h3>
          <p className="mt-0.5 truncate text-xs font-semibold text-text-muted"><PlatformLine platforms={game.platforms} /></p>
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
            {listed && !unavailable ? (
              <>
                <span className="price-tag cut cut-tag text-base">
                  {listed.listings.some((l) => l.isAvailable && l.price !== listed.listing.price) && "From "}
                  {formatPrice(listed.listing.price)}
                </span>
                {listed.listing.compareAtPrice && listed.listing.compareAtPrice > listed.listing.price && (
                  <span className="text-xs text-text-muted line-through">{formatPrice(listed.listing.compareAtPrice)}</span>
                )}
              </>
            ) : (
              <span className="text-xs font-medium text-text-muted">{unavailable ? "Ask us about it" : "Check availability"}</span>
            )}
          </div>
          {(cheapestRent !== undefined || rating !== null) && (
            <div className="mt-1.5 flex items-center justify-between gap-2 text-xs font-semibold">
              {cheapestRent !== undefined && <span className="min-w-0 truncate text-trust-600">Rent from {formatPrice(cheapestRent)}</span>}
              {rating !== null && (
                <span className="ml-auto inline-flex shrink-0 items-center gap-0.5 text-rating-gold">
                  <IconStar className="h-3.5 w-3.5" />
                  {rating.toFixed(1)}
                </span>
              )}
            </div>
          )}
        </div>
      </Link>
      {actions && <div className="absolute right-2 top-2 z-10">{actions}</div>}
    </article>
  );
}

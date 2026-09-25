import { useState } from "react";
import { Link } from "react-router-dom";
import type { ListedGame } from "../types/listing";
import { averageRating, deliveryEtaLabel } from "../types/listing";
import { getGameImage, placeholderColor } from "../data/gameImages";
import { EtaBadge, PlatformBadge, RatingChip, UnavailableBadge } from "./Badges";
import { TiltCard } from "./TiltCard";
import { soundFx } from "../utils/soundEffects";

export function ListingCard({ game }: { game: ListedGame }) {
  const { cover } = getGameImage(game.id);
  const bgColor = placeholderColor(game.id);
  const rating = averageRating(game.reviews);
  const [imgError, setImgError] = useState(false);

  return (
    <TiltCard className="h-full">
      <Link
        to={`/games/${game.id}`}
        onMouseEnter={() => soundFx.playHover()}
        onClick={() => soundFx.playClick()}
        className="group relative flex h-full w-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-bg-surface/90 backdrop-blur-md transition-all duration-300 hover:border-brand-500/60 hover:shadow-glow-brand"
      >
        {/* Poster Image Section */}
        <div
          className="relative aspect-[3/4] w-full overflow-hidden bg-bg-surface-raised"
          style={{ backgroundColor: bgColor }}
        >
          {!imgError ? (
            <img
              src={cover}
              alt={game.title}
              loading="lazy"
              onError={() => setImgError(true)}
              className="h-full w-full object-cover transition-transform duration-500 will-change-transform group-hover:scale-108"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center p-4 text-center">
              <span className="font-display text-sm font-bold text-white/40">{game.title}</span>
            </div>
          )}

          {/* Badges on top */}
          <div className="absolute left-2.5 top-2.5 z-10 flex flex-wrap gap-1.5">
            <PlatformBadge platform={game.listing.platform} />
          </div>

          <div className="absolute right-2.5 top-2.5 z-10">
            <span className="rounded-md border border-brand-500/40 bg-black/60 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-100 backdrop-blur-md">
              {game.genre}
            </span>
          </div>

          {/* Unavailable overlay */}
          {!game.listing.isAvailable && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-bg-base/80 backdrop-blur-sm">
              <UnavailableBadge />
            </div>
          )}

          {/* Vignette gradients */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-bg-surface via-transparent to-black/30" />

          {/* Quick Action Overlay on Hover */}
          <div className="pointer-events-none absolute inset-x-0 bottom-2 z-10 flex justify-center opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0 translate-y-2">
            <span className="rounded-lg bg-brand-500/90 px-3 py-1 text-xs font-bold text-white shadow-lg backdrop-blur-sm">
              Rent or Buy →
            </span>
          </div>
        </div>

        {/* Card Details */}
        <div className="flex flex-1 flex-col justify-between p-3.5">
          <div>
            <h3 className="line-clamp-1 font-display text-sm font-bold text-text-primary transition-colors group-hover:text-brand-100">
              {game.title}
            </h3>
            <div className="mt-1.5 flex items-center justify-between text-xs text-text-muted">
              <EtaBadge label={deliveryEtaLabel(game.listing.deliveryEtaMinutes)} />
              <RatingChip rating={rating} count={game.reviews.length} />
            </div>
          </div>

          {/* Dual Price Bar (Flat Rent & Buy per game) */}
          <div className="mt-3 flex items-end justify-between border-t border-white/5 pt-2.5">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider text-trust-600">
                Rent
              </span>
              <span className="font-display text-sm font-black text-trust-600">
                On request
              </span>
            </div>

            <div className="flex flex-col text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                Buy to own
              </span>
              <span className="font-display text-sm font-black text-text-primary">
                ₹{game.listing.price.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </TiltCard>
  );
}

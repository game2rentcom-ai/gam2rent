import { useState } from "react";
import { Link } from "react-router-dom";
import type { CatalogGame } from "../data/catalogTypes";
import { getGameImage, placeholderColor } from "../data/gameImages";
import { PlatformBadge } from "./Badges";
import { TiltCard } from "./TiltCard";
import { soundFx } from "../utils/soundEffects";

export function CatalogCard({ game }: { game: CatalogGame }) {
  const { cover } = getGameImage(game.id);
  const bgColor = placeholderColor(game.id);
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

          {/* Platform badges */}
          <div className="absolute left-2.5 top-2.5 z-10 flex flex-wrap gap-1">
            <PlatformBadge platform={game.platforms[0]} />
          </div>

          <div className="absolute right-2.5 top-2.5 z-10">
            <span className="rounded-md border border-brand-500/40 bg-black/60 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-100 backdrop-blur-md">
              {game.genre}
            </span>
          </div>

          {/* Vignette gradients */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-bg-surface via-transparent to-black/30" />

          {/* Quick Action Overlay on Hover */}
          <div className="pointer-events-none absolute inset-x-0 bottom-2 z-10 flex justify-center opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0 translate-y-2">
            <span className="rounded-lg bg-brand-500/90 px-3 py-1 text-xs font-bold text-white shadow-lg backdrop-blur-sm">
              Check Rent / Buy →
            </span>
          </div>
        </div>

        {/* Card Details */}
        <div className="flex flex-1 flex-col justify-between p-3.5">
          <div>
            <h3 className="line-clamp-1 font-display text-sm font-bold text-text-primary transition-colors group-hover:text-brand-100">
              {game.title}
            </h3>
            <p className="mt-1 line-clamp-1 text-xs text-text-muted">
              {game.developer}
            </p>
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-2.5">
            <span className="text-xs font-semibold text-brand-500">
              Rent or Buy
            </span>
            <span className="text-xs font-semibold text-text-muted group-hover:text-white transition-colors">
              Available on request →
            </span>
          </div>
        </div>
      </Link>
    </TiltCard>
  );
}

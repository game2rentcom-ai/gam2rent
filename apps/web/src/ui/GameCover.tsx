import { useState } from "react";
import type { CatalogGame } from "../data/catalogTypes";
import { GenreIcon } from "../components/GenreIcon";
import { artFor, artGradient, slotSpec, srcSetFor, type Slot } from "../lib/images";

// A game's picture, built for phones: a fixed aspect ratio (no layout jump while loading), the
// smallest image that stays sharp, lazy loading, generated art underneath so it never looks empty,
// and a graceful chain when an image fails (optimiser -> original URL -> generated art only).
interface Props {
  game: Pick<CatalogGame, "id" | "title" | "genre" | "coverUrl" | "heroUrl">;
  slot?: Slot;
  /** true for the one image that is visible on first paint (the page's main picture) */
  priority?: boolean;
  /** overrides the slot's default `sizes` when the layout is unusual */
  sizes?: string;
  className?: string;
  /** shown over the picture, e.g. a badge */
  children?: React.ReactNode;
}

export function GameCover({ game, slot = "card", priority = false, sizes, className = "", children }: Props) {
  const spec = slotSpec(slot);
  const art = artFor(game);
  const url = slot === "hero" ? art.hero : art.cover;
  const [stage, setStage] = useState<"optimised" | "original" | "failed">("optimised");
  const [loaded, setLoaded] = useState(false);

  const showImage = url && stage !== "failed";
  const image = url ? (stage === "optimised" ? srcSetFor(url, slot) : { src: url }) : null;

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ aspectRatio: spec.ratio, background: artGradient(game.id) }}>
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center text-white/25" aria-hidden="true">
          <GenreIcon genre={game.genre} className={slot === "hero" ? "h-16 w-16" : "h-12 w-12"} />
        </div>
      )}
      {showImage && image && (
        <img
          key={stage}
          src={image.src}
          srcSet={image.srcSet}
          sizes={image.srcSet ? sizes ?? spec.sizes : undefined}
          alt={`${game.title} cover art`}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setStage(stage === "optimised" ? "original" : "failed")}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
          style={slot === "hero" ? { objectPosition: "center 25%" } : undefined}
        />
      )}
      {children}
    </div>
  );
}

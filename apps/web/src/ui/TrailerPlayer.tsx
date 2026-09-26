import { useState } from "react";

// A trailer that costs nothing until someone asks for it. YouTube's player is over 1 MB of script and
// contacts Google on load; a phone should not pay that for a video nobody tapped. This shows a poster
// with a play button and only creates the player after the tap.
interface Props {
  youtubeId: string;
  title: string;
  /** the poster picture, e.g. <GameCover slot="hero" .../> */
  poster: React.ReactNode;
  className?: string;
}

export function TrailerPlayer({ youtubeId, title, poster, className = "" }: Props) {
  const [playing, setPlaying] = useState(false);

  if (playing) {
    return (
      <div className={`aspect-video overflow-hidden rounded-2xl bg-black ${className}`}>
        <iframe
          className="h-full w-full"
          src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(youtubeId)}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
          title={title}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      aria-label={`Play trailer: ${title}`}
      className={`group relative block w-full overflow-hidden rounded-2xl border border-border-strong text-left ${className}`}
    >
      {poster}
      <span className="absolute inset-0 bg-black/35 transition-colors group-hover:bg-black/25" aria-hidden="true" />
      <span className="absolute inset-0 flex flex-col items-center justify-center gap-2" aria-hidden="true">
        <span className="medal cut cut-hex h-16 w-16 [--medal:var(--color-accent-300)] transition-transform group-hover:scale-105">
          <svg viewBox="0 0 24 24" className="ml-1 h-7 w-7" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
        </span>
        <span className="rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white">Watch trailer</span>
      </span>
    </button>
  );
}

import { LOCAL_ART, STEAM_ART } from "../data/artMap";
import type { CatalogGame } from "../data/catalogTypes";

// Where a game's pictures come from and how big to ask for them.
//
// Priority: the owner's uploaded image (games.cover_url / hero_url) > artwork that ships with the
// site > Steam artwork VERIFIED to be that exact game (data/artMap.ts) > nothing, in which case the UI
// draws generated art. Stock photos and another game's poster are NEVER used as a stand-in — a wrong
// picture is worse than none.
const STEAM_CDN = "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps";
//
// Size: in production, remote images are requested through Vercel's image optimiser
// (`/_vercel/image`, configured in vercel.json), which resizes to the width a slot actually needs and
// serves WebP/AVIF. If that request fails the component falls back to the original URL, so a
// misconfigured optimiser can slow the page down but never blank it. Set VITE_IMAGE_PROXY=off to
// bypass it.

const PROXY = import.meta.env.PROD && import.meta.env.VITE_IMAGE_PROXY !== "off";

export type Slot = "card" | "cover" | "hero";

// Widths must match `images.sizes` in vercel.json. `sizes` describes the slot's rendered width so the
// browser picks the smallest candidate that stays sharp on the current screen.
const SLOTS: Record<Slot, { widths: number[]; sizes: string; ratio: string }> = {
  card: { widths: [240, 360, 480], sizes: "(min-width: 1280px) 220px, (min-width: 1024px) 20vw, (min-width: 640px) 30vw, 46vw", ratio: "2 / 3" },
  cover: { widths: [360, 480, 720], sizes: "(min-width: 1024px) 320px, 60vw", ratio: "2 / 3" },
  hero: { widths: [640, 960, 1280], sizes: "100vw", ratio: "16 / 9" },
};

export function slotSpec(slot: Slot) {
  return SLOTS[slot];
}

export function artFor(game: Pick<CatalogGame, "id" | "coverUrl" | "heroUrl">): { cover?: string; hero?: string } {
  const local = LOCAL_ART[game.id];
  const steam = STEAM_ART[game.id];
  const cover = game.coverUrl ?? local?.cover ?? (steam ? `${STEAM_CDN}/${steam.app}/library_600x900.jpg` : undefined);
  const hero = game.heroUrl ?? local?.hero ?? (steam ? `${STEAM_CDN}/${steam.app}/${steam.hero}.jpg` : undefined);
  return { cover, hero: hero ?? cover };
}

export function sized(url: string, width: number): string {
  if (!PROXY || !/^https?:\/\//.test(url)) return url;
  return `/_vercel/image?url=${encodeURIComponent(url)}&w=${width}&q=75`;
}

export function srcSetFor(url: string, slot: Slot): { src: string; srcSet?: string } {
  const { widths } = SLOTS[slot];
  if (!PROXY || !/^https?:\/\//.test(url)) return { src: url };
  return { src: sized(url, widths[1]), srcSet: widths.map((w) => `${sized(url, w)} ${w}w`).join(", ") };
}

// Deterministic per-game colours for the generated art, kept inside the brand's violet-to-blue range.
export function artGradient(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  const hue = 235 + (hash % 100); // 235–334: blue → violet → magenta
  return `linear-gradient(145deg, hsl(${hue} 55% 28%), hsl(${(hue + 45) % 360} 60% 14%))`;
}

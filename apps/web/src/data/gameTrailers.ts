// Verified official 4K/HD gameplay and launch trailers for AAA titles.
export interface GameTrailer {
  youtubeId: string;
  title: string;
}

export const GAME_TRAILERS: Record<string, GameTrailer> = {
  "cyberpunk-2077": {
    youtubeId: "qIcTM8WXFjk",
    title: "Cyberpunk 2077 — Official Launch Trailer",
  },
  "gta-5": {
    youtubeId: "QkkoHAzjnUs",
    title: "Grand Theft Auto V — Official Trailer",
  },
  "black-myth-wukong": {
    youtubeId: "O2nKee_vY70",
    title: "Black Myth: Wukong — Official Launch Trailer",
  },
  "elden-ring": {
    youtubeId: "E3Huy2cdih0",
    title: "Elden Ring — Official Launch Trailer",
  },
  "god-of-war": {
    youtubeId: "K0u_kODnGQU",
    title: "God of War — PC Features Trailer",
  },
  "spider-man-2": {
    youtubeId: "bgqGdIoa52s",
    title: "Marvel's Spider-Man 2 — Launch Trailer",
  },
  "silent-hill-2": {
    youtubeId: "g1v55A25E8M",
    title: "SILENT HILL 2 — Remake Launch Trailer",
  },
  "forza-horizon-5": {
    youtubeId: "FYH9n37B7Yw",
    title: "Forza Horizon 5 — Official Trailer",
  },
  "red-dead-redemption-2": {
    youtubeId: "eaW0tYpxyp0",
    title: "Red Dead Redemption 2 — Official Launch Trailer",
  },
  "the-witcher-3": {
    youtubeId: "c0i88t0Kacs",
    title: "The Witcher 3: Wild Hunt — Next-Gen Update Trailer",
  },
  "astro-bot": {
    youtubeId: "un_4rV38Yq0",
    title: "Astro Bot — Gameplay Trailer",
  },
  "ea-sports-fc": {
    youtubeId: "XhP3Xh4LMA8",
    title: "EA SPORTS FC — Gameplay Showcase",
  },
  "tekken": {
    youtubeId: "2hpuGQ__gvQ",
    title: "Tekken 8 — Official Launch Trailer",
  },
  "ghost-of-tsushima": {
    youtubeId: "b7c2G02_2_Q",
    title: "Ghost of Tsushima — Director's Cut Trailer",
  },
};

export function getGameTrailer(id: string): GameTrailer | null {
  return GAME_TRAILERS[id] || null;
}

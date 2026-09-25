// Catalog data model for the full title list (documentation/decision-log.md, 2026-09-21 "Iteration
// 4" entry). Distinct from the old narrow mockListings.ts model — this is deliberately richer
// (genre, developer/publisher, platform breadth) because the real catalog spans PS4/PS5/Xbox/PC/
// Cloud titles, not just the 3 platforms the original schema assumed. `category` separates real
// games from the handful of non-game software entries in the source list (CapCut, Canva,
// ChatGPT) so the UI never mislabels a productivity tool as a "PS4 game."
export type Platform = "pc" | "ps4" | "ps5" | "xbox" | "cloud";
export type Category = "game" | "app";

export interface CatalogGame {
  id: string;
  title: string;
  /** Groups multi-installment entries (e.g. all Resident Evil titles) for browsing/badging —
   * not a second data source, just a shared label. */
  franchise: string;
  category: Category;
  genre: string;
  platforms: Platform[];
  developer: string;
  publisher: string;
  /** Real, publicly known release information — not fabricated. Left honestly vague
   * ("various", a year range) where a single line item spans multiple releases. */
  releaseInfo: string;
  description: string;
  /** Set by the owner in the admin panel; otherwise the built-in artwork lookup (data/gameImages.ts)
   * or generated art is used. Must be https. */
  coverUrl?: string;
  heroUrl?: string;
  /** false hides the rent option. Defaults to true. */
  isRentable?: boolean;
}

export const PLATFORM_LABEL: Record<Platform, string> = {
  pc: "PC",
  ps4: "PS4",
  ps5: "PS5",
  xbox: "Xbox",
  cloud: "Cloud Gaming",
};

// Whether the storefront shows how many games it has ("Search 116 games", "35 games" on a platform tile). Off
// unless the owner turns it on in Admin → Settings: a small number makes a growing store look thin.
export const gameCountsShown = (setting: (key: string) => string | undefined): boolean => setting("show_game_counts") === "true";

export const searchPlaceholder = (setting: (key: string) => string | undefined, count: number): string =>
  gameCountsShown(setting) ? `Search ${count} games` : "Search games";

import type { Platform } from "../data/catalogTypes";

export const formatPrice = (rupees: number) => `₹${rupees.toLocaleString("en-IN")}`;

export const PLATFORM_SHORT: Record<Platform, string> = { pc: "PC", ps4: "PS4", ps5: "PS5", xbox: "Xbox", cloud: "Cloud" };

export const platformLine = (platforms: Platform[]) => platforms.map((p) => PLATFORM_SHORT[p]).join(" · ");

/** "~45 min", "~1.5 hr" — delivery time as promised by the listing. */
export function etaLabel(minutes: number): string {
  if (minutes < 60) return `~${minutes} min`;
  return `~${Math.round((minutes / 60) * 10) / 10} hr`;
}

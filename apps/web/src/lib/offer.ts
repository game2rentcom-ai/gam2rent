// The launch offer, as the owner set it in Admin → Settings. The database decides what a customer pays; this only
// tells the site what to announce. Dates are India time, from midnight on the start day for the set number of days.
export const OFFER_TITLE = "Buy one, get one free";

export interface ActiveOffer {
  title: string;
  /** The last day it runs, in words, e.g. "10 October". */
  until: string;
}

export function activeOffer(setting: (key: string) => string | undefined, nowMs: number): ActiveOffer | null {
  if (setting("launch_offer_enabled") !== "true") return null;
  const starts = setting("launch_offer_starts") ?? "";
  const days = Number(setting("launch_offer_days"));
  if (!/^\d{4}-\d{2}-\d{2}$/.test(starts) || !Number.isInteger(days) || days < 1) return null;
  const start = Date.parse(`${starts}T00:00:00+05:30`);
  const end = start + days * 86_400_000;
  if (Number.isNaN(start) || nowMs < start || nowMs >= end) return null;
  return {
    title: setting("launch_offer_title")?.trim() || OFFER_TITLE,
    until: new Date(end - 1).toLocaleDateString("en-IN", { day: "numeric", month: "long", timeZone: "Asia/Kolkata" }),
  };
}

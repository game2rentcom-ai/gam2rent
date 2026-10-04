import { useEffect } from "react";
import { useStore } from "../data/store";

// Each page names itself in the browser tab, in history and in what a search engine or a link preview shows.
// The shop's name is the owner's (Settings), falling back to the built-in one.
const FALLBACK_NAME = "Game2Rent";
const DEFAULT_DESCRIPTION = "Buy or rent digital games for PC, PlayStation and cloud gaming — with a delivery time you can see up front, and a free replacement if anything goes wrong.";

/** `title` undefined = the shop's name alone (home); null = leave the tab alone (a page that names itself). */
export function usePageMeta(title: string | null | undefined, description?: string) {
  const name = useStore().setting("business_name") || FALLBACK_NAME;
  useEffect(() => {
    if (title === null) return;
    document.title = title ? `${title} · ${name}` : name;
    const text = description ?? DEFAULT_DESCRIPTION;
    document.querySelector('meta[name="description"]')?.setAttribute("content", text);
    document.querySelector('meta[property="og:title"]')?.setAttribute("content", title ?? name);
    document.querySelector('meta[property="og:description"]')?.setAttribute("content", text);
  }, [title, description, name]);
}

/** A sentence about a game for the page description: its own text if it has any, else a plain one. */
export function gameDescription(title: string, description: string, platforms: string): string {
  const own = description.trim();
  if (own) return own.length > 155 ? `${own.slice(0, 154).trimEnd()}…` : own;
  return `Buy or rent ${title} for ${platforms}. The delivery time is shown up front, with a free replacement if anything goes wrong.`;
}

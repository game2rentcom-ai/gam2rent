import { useStore } from "../data/store";
import { useShop } from "../shop/context";

/**
 * Where "Request a game" leads. When the full store is live it is the request board (people can also
 * vote for what others asked); until then it opens a chat with the game's name already filled in.
 */
export function useRequestLink(title?: string): { to: string; href?: undefined } | { href: string | undefined; to?: undefined } {
  const { contactLink } = useStore();
  const { ordering } = useShop();
  const name = title?.trim();
  if (ordering) return { to: `/requests${name ? `?title=${encodeURIComponent(name)}` : ""}` };
  return { href: contactLink(name ? `Hi! Could you add "${name}" to the store?` : "Hi! There's a game I'd like you to add.") };
}

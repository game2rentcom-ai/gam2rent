import { createContext, useContext } from "react";
import type { AuthResult } from "../auth/context";

/** One game in the cart. Prices are never held here: the database prices the cart at checkout. */
export interface CartLine {
  gameId: string;
  kind: "buy" | "rent";
  planId: string | null;
  platform: string | null;
}

export interface Shop {
  /** Whether the shopping tables answered for the signed-in customer; null until known (or when signed out). */
  ready: boolean | null;
  /** Online ordering is switched on by the owner and works, so Buy/Rent add to a cart instead of opening a chat. */
  ordering: boolean;
  /** The last attempt to read the cart and wishlist failed for a temporary reason; what's listed may be out of date. */
  failed: boolean;
  wishlist: readonly string[];
  cart: readonly CartLine[];
  toggleWishlist(gameId: string): Promise<AuthResult>;
  addToCart(line: CartLine): Promise<AuthResult>;
  removeFromCart(gameId: string): Promise<AuthResult>;
  /** Re-read the cart and wishlist (after a purchase empties the cart). */
  refresh(): void;
}

export const ShopContext = createContext<Shop | null>(null);

export function useShop(): Shop {
  const shop = useContext(ShopContext);
  if (!shop) throw new Error("useShop must be used inside <ShopProvider>");
  return shop;
}

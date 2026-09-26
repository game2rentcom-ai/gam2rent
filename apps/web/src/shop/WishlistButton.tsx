import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../auth/context";
import { backendConfigured } from "../lib/supabase";
import { IconHeart } from "../ui/icons";
import { useShop } from "./context";

// A heart on the game page. Signed-out visitors are taken to log in and brought back; if the wishlist
// isn't available (older database) the button simply isn't shown.
export function WishlistButton({ gameId, title }: { gameId: string; title: string }) {
  const { status } = useAuth();
  const shop = useShop();
  const { pathname } = useLocation();
  const [problem, setProblem] = useState("");
  const saved = shop.wishlist.includes(gameId);
  const style = "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border-subtle bg-bg-surface text-text-primary hover:border-brand-500";

  if (!backendConfigured || status === "loading" || shop.ready === false) return null;
  if (status === "anonymous") {
    return <Link to={`/login?next=${encodeURIComponent(pathname)}`} aria-label={`Log in to save ${title} to your wishlist`} className={style}><IconHeart /></Link>;
  }
  return (
    <span className="flex flex-col items-end gap-1">
      <button
        type="button"
        aria-pressed={saved}
        aria-label={saved ? `Remove ${title} from your wishlist` : `Save ${title} to your wishlist`}
        onClick={async () => setProblem((await shop.toggleWishlist(gameId)).error ?? "")}
        className={`${style} ${saved ? "text-brand-500" : ""}`}
      >
        <IconHeart filled={saved} />
      </button>
      {problem && <span role="alert" className="max-w-40 text-right text-xs text-red-300">{problem}</span>}
    </span>
  );
}

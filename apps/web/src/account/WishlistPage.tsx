import { useState } from "react";
import { Link } from "react-router-dom";
import { useStore } from "../data/store";
import { useShop } from "../shop/context";
import { Button } from "../ui/Button";
import { Notice } from "../ui/Form";
import { GameCard } from "../ui/GameCard";
import { IconHeart } from "../ui/icons";

export function WishlistPage() {
  const { games } = useStore();
  const shop = useShop();
  const [problem, setProblem] = useState("");
  const saved = games.filter((g) => shop.wishlist.includes(g.id));

  return (
    <div className="flex flex-col gap-5 py-2 sm:py-6">
      <header>
        <Link to="/account" className="-ml-2 inline-flex min-h-11 items-center rounded-lg px-2 text-sm font-semibold text-text-muted hover:text-text-primary">← My account</Link>
        <h1 className="font-display text-3xl font-black text-text-primary">My wishlist</h1>
      </header>
      {problem && <Notice tone="error">{problem}</Notice>}
      {shop.ready === null && <div className="h-40 animate-pulse rounded-2xl bg-bg-surface" aria-busy="true" aria-label="Loading your wishlist" />}
      {shop.ready === false && <Notice tone="error">Your wishlist isn’t available right now. Please try again later.</Notice>}
      {shop.ready && saved.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border-subtle px-4 py-12 text-center">
          <p className="text-sm text-text-muted">Tap the heart on a game to save it here.</p>
          <Button to="/browse">Browse games</Button>
        </div>
      )}
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {saved.map((game) => (
          <li key={game.id}>
            <GameCard
              game={game}
              actions={
                <button
                  type="button"
                  aria-label={`Remove ${game.title} from your wishlist`}
                  onClick={async () => setProblem((await shop.toggleWishlist(game.id)).error ?? "")}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-black/60 text-brand-500 backdrop-blur"
                >
                  <IconHeart filled />
                </button>
              }
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

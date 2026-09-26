import { useEffect, useState } from "react";
import { useAuth } from "../auth/context";
import { readRemote } from "../data/remote";
import { useStore } from "../data/store";
import { useShop } from "../shop/context";
import { GameCard } from "../ui/GameCard";
import { Rail, Section } from "../ui/Section";

// "Picked for you": the database ranks games by the franchise and genre of what the customer saved or
// bought, their set-up choices, and what has been selling; each pick says why. Visitors who aren't signed
// in get what has been selling lately. With nothing to base it on, nothing is shown.
interface Suggestion { game_id: string; reason: string }

export function Suggestions() {
  const { status, client } = useAuth();
  const { ordering } = useShop();
  const { findGame } = useStore();
  const [result, setResult] = useState<{ who: string; list: Suggestion[] } | null>(null);
  const who = status === "signed-in" ? "me" : "guest";

  useEffect(() => {
    if (!ordering || status === "loading") return;
    let cancelled = false;
    const load: Promise<Suggestion[] | null> =
      status === "signed-in"
        ? client().then(async (c) => {
            const { data, error } = await c.rpc("recommend_games", { p_limit: 12 });
            return error ? null : (data as Suggestion[]);
          })
        : readRemote<Suggestion[]>("rpc/recommend_games", { p_limit: 12 });
    load.then(
      (list) => !cancelled && setResult({ who, list: list ?? [] }),
      () => !cancelled && setResult({ who, list: [] }),
    );
    return () => {
      cancelled = true;
    };
  }, [ordering, status, who, client]);

  const picks = (result?.who === who ? result.list : []).flatMap((s) => {
    const game = findGame(s.game_id);
    return game ? [{ game, reason: s.reason }] : [];
  });
  if (!ordering || picks.length === 0) return null;

  return (
    <Section title={who === "me" ? "Picked for you" : "Popular right now"}>
      <Rail label={who === "me" ? "Games picked for you" : "Popular games"}>
        {picks.map(({ game, reason }) => (
          <div key={game.id} className="w-36 shrink-0 snap-start sm:w-44">
            <GameCard game={game} />
            <p className="mt-1 line-clamp-2 px-0.5 text-xs text-text-muted">{reason}</p>
          </div>
        ))}
      </Rail>
    </Section>
  );
}

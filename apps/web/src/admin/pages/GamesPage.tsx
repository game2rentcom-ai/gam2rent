import type { SupabaseClient } from "@supabase/supabase-js";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PLATFORM_SHORT } from "../../ui/format";
import { searchGames } from "../../lib/search";
import { Badge, Chip } from "../../ui/Chip";
import { Button } from "../../ui/Button";
import { IconSearch } from "../../ui/icons";
import { ok, useLoad } from "../../lib/api";
import { ErrorNote, Loading, PageHeader } from "../kit";

interface Row { id: string; title: string; genre: string; platforms: string[]; is_published: boolean; is_rentable: boolean }
type Filter = "all" | "hidden" | "priced" | "unpriced";
const PAGE = 40;

async function loadGames(client: SupabaseClient) {
  const [games, listings] = await Promise.all([
    ok(client.from("games").select("id,title,genre,platforms,is_published,is_rentable").order("title")),
    ok(client.from("listings").select("game_id")),
  ]);
  return { games: games as Row[], priced: new Set((listings as { game_id: string }[]).map((l) => l.game_id)) };
}

export function GamesPage() {
  const { data, error, loading } = useLoad(loadGames, undefined);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [visible, setVisible] = useState(PAGE);

  const rows = useMemo(() => {
    if (!data) return [];
    let list = query.trim() ? searchGames(data.games, query) : data.games;
    if (filter === "hidden") list = list.filter((g) => !g.is_published);
    if (filter === "priced") list = list.filter((g) => data.priced.has(g.id));
    if (filter === "unpriced") list = list.filter((g) => !data.priced.has(g.id));
    return list;
  }, [data, query, filter]);

  if (loading) return <Loading />;
  if (error || !data) return <ErrorNote message={error ?? "Couldn’t load the games."} />;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Games" subtitle={`${data.games.length} games in the store`} actions={<Button to="/admin/games/new">Add a game</Button>} />
      <div className="relative">
        <IconSearch className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted" />
        <input
          type="search"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setVisible(PAGE); }}
          placeholder="Search games"
          aria-label="Search games"
          className="min-h-11 w-full rounded-xl border border-border-subtle bg-bg-surface pl-11 pr-4 text-base text-text-primary outline-none placeholder:text-text-muted focus:border-brand-500"
        />
      </div>
      <div role="group" aria-label="Show" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {([["all", "All"], ["priced", "With a price"], ["unpriced", "No price yet"], ["hidden", "Hidden"]] as [Filter, string][]).map(([value, label]) => (
          <Chip key={value} selected={filter === value} onClick={() => { setFilter(value); setVisible(PAGE); }}>{label}</Chip>
        ))}
      </div>
      <p className="text-sm text-text-muted" aria-live="polite">{rows.length} shown</p>
      <ul className="flex flex-col gap-2">
        {rows.slice(0, visible).map((g) => (
          <li key={g.id}>
            <Link to={`/admin/games/${g.id}`} className="flex min-h-16 items-center justify-between gap-3 rounded-xl border border-white/10 bg-bg-surface px-4 py-2 hover:border-brand-500/50">
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-text-primary">{g.title}</span>
                <span className="block truncate text-xs text-text-muted">{g.platforms.map((p) => PLATFORM_SHORT[p as keyof typeof PLATFORM_SHORT] ?? p).join(" · ")}{g.genre ? ` · ${g.genre}` : ""}</span>
              </span>
              <span className="flex shrink-0 flex-wrap justify-end gap-1">
                {!g.is_published && <Badge tone="warn">Hidden</Badge>}
                {data.priced.has(g.id) ? <Badge tone="trust">Priced</Badge> : <Badge>No price</Badge>}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {rows.length > visible && <Button variant="secondary" size="lg" onClick={() => setVisible((v) => v + PAGE)}>Show more</Button>}
    </div>
  );
}

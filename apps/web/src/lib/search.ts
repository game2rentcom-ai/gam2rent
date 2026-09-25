// Search over the store's own game list — instant, no server. Forgiving on purpose: case, accents and
// punctuation don't matter ("spiderman", "Spider-Man"), word starts match ("cyber" finds Cyberpunk),
// every word must match somewhere, and a one-letter typo in a longer word still finds the game.
// Fields searched, best first: title, then franchise / genre / developer / publisher.

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

// true when `a` and `b` differ by at most one inserted, deleted or substituted letter
function withinOneEdit(a: string, b: string): boolean {
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  let j = 0;
  let edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      i++;
      j++;
      continue;
    }
    if (++edits > 1) return false;
    if (a.length > b.length) i++;
    else if (b.length > a.length) j++;
    else {
      i++;
      j++;
    }
  }
  return edits + (a.length - i) + (b.length - j) <= 1;
}

interface Searchable {
  title: string;
  franchise?: string;
  genre?: string;
  developer?: string;
  publisher?: string;
}

export function scoreGame(game: Searchable, rawQuery: string): number {
  const q = normalize(rawQuery);
  if (!q) return 0;
  const title = normalize(game.title);
  const titleWords = title.split(" ");
  const other = normalize([game.franchise, game.genre, game.developer, game.publisher].filter(Boolean).join(" "));
  const tokens = q.split(" ");

  let score = 0;
  if (title === q) score += 100;
  else if (title.startsWith(q)) score += 80;
  else if (title.includes(q)) score += 55;
  else if (title.replace(/ /g, "").includes(q.replace(/ /g, ""))) score += 45; // "spiderman" vs "spider man"

  for (const token of tokens) {
    if (titleWords.some((w) => w.startsWith(token))) score += 20;
    else if (other.includes(token)) score += 8;
    else if (token.length >= 4 && titleWords.some((w) => withinOneEdit(w, token) || withinOneEdit(w.slice(0, token.length), token))) score += 6;
    else return 0; // every word has to match somewhere
  }
  return score;
}

export function searchGames<T extends Searchable>(games: T[], query: string, limit = Infinity): T[] {
  return games
    .map((game) => ({ game, score: scoreGame(game, query) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.game.title.localeCompare(b.game.title))
    .slice(0, limit)
    .map((x) => x.game);
}

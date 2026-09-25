// Builds src/data/artMap.ts: which Steam app supplies each game's artwork — VERIFIED against Steam's
// own store data, so a game never shows another game's poster.
//
//   node scripts/build-art-map.mjs        (takes ~3 minutes: it is polite to Steam's API)
//
// A game gets artwork only when Steam's title for the app matches the game's title exactly (ignoring
// punctuation, ™/®, and edition words like "Remastered" or "Director's Cut"). Anything ambiguous — a
// whole series in one entry, a game not on Steam, a name that only *contains* the title — gets no
// Steam art and the app draws generated art instead. That is deliberate: no picture beats a wrong one.
// OVERRIDES lists the few apps that were checked by hand (abbreviated titles like "GTA 5").
import { readFileSync, writeFileSync } from "node:fs";
import { catalog } from "../src/data/catalog.ts";

const OVERRIDES = {
  "gta-5": "271590", // "Grand Theft Auto V Legacy" — same game, renamed store page
  "the-witcher-3": "292030",
  smite: "386360",
  "god-of-war": "1593500", // the catalog entry lists several God of War titles; the PC release is the 2018 game
  "resident-evil-4": "2050650", // the catalog entry names both the original and the remake; Steam sells the remake
  "resident-evil-2-remake": "883710", // Steam's title is just "RESIDENT EVIL 2"
  "resident-evil-3-remake": "952060", // Steam's title is just "RESIDENT EVIL 3"
};
// Entries that stand for a whole series: any one game's poster would misrepresent them.
const SKIP = new Set(["baldurs-gate", "assassins-creed", "batman-arkham", "devil-may-cry"]);
// Local artwork files that ship in public/ (used before Steam).
const LOCAL = { "astro-bot": { cover: "/games/astro-bot-cover.jpg", hero: "/games/astro-bot-hero.jpg" } };

// Apps found on a previous run are re-checked first (cheaper than searching again).
let legacy = {};
try {
  const previous = readFileSync(new URL("../src/data/artMap.ts", import.meta.url), "utf8");
  legacy = Object.fromEntries([...previous.matchAll(/"([a-z0-9-]+)": \{ app: "(\d+)"/g)].map((m) => [m[1], m[2]]));
} catch { /* first run */ }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const IGNORED = new Set(["the", "of", "and", "a", "an", "edition", "remastered", "remake", "definitive", "complete", "deluxe", "goty", "game", "year", "ultimate", "standard", "director", "s", "cut", "enhanced", "legacy", "biohazard", "collection"]);
const tokens = (s) => s.toLowerCase().normalize("NFKD").replace(/[™®©]/g, "").replace(/[^a-z0-9]+/g, " ").trim().split(" ").filter((t) => t && !IGNORED.has(t));
const isYear = (t) => /^20[12]\d$/.test(t);

function sameTitle(gameTitle, steamName) {
  const a = tokens(gameTitle.replace(/\(.*?\)/g, ""));
  const b = tokens(steamName);
  if (!a.length || a.length !== b.filter((t) => !isYear(t) || a.includes(t)).length) return false;
  return a.every((t) => b.includes(t));
}

async function getJson(url) {
  for (let i = 0; i < 3; i++) {
    const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (r.status === 429) { await sleep(20000); continue; }
    return r.ok ? r.json() : null;
  }
  return null;
}
async function steamName(id) {
  const j = await getJson(`https://store.steampowered.com/api/appdetails?appids=${id}&filters=basic`);
  await sleep(600);
  return j?.[id]?.success ? j[id].data.name : null;
}
async function search(title) {
  const j = await getJson(`https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(title.replace(/\(.*?\)/g, ""))}&l=english&cc=us`);
  await sleep(600);
  return (j?.items ?? []).filter((i) => i.type === "app").slice(0, 6).map((i) => ({ id: String(i.id), name: i.name }));
}
const exists = async (id, file) => {
  try { return (await fetch(`https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${id}/${file}`, { method: "HEAD" })).ok; } catch { return false; }
};

const map = {};
const log = [];
for (const g of catalog) {
  if (g.category !== "game" || LOCAL[g.id] || SKIP.has(g.id)) continue;
  let app = OVERRIDES[g.id];
  let how = app ? "override" : "";
  if (!app && legacy[g.id]) {
    const name = await steamName(legacy[g.id]);
    if (name && sameTitle(g.title, name)) { app = legacy[g.id]; how = `existing "${name}"`; }
  }
  if (!app) {
    const hit = (await search(g.title)).find((c) => sameTitle(g.title, c.name));
    if (hit) { app = hit.id; how = `search "${hit.name}"`; }
  }
  if (!app) { log.push(`  none  ${g.id}`); continue; }
  if (!(await exists(app, "library_600x900.jpg"))) { log.push(`  none  ${g.id}  (app ${app} has no portrait art)`); continue; }
  map[g.id] = { app, hero: (await exists(app, "library_hero.jpg")) ? "library_hero" : "header" };
  log.push(`  ok    ${g.id.padEnd(32)} ${how}`);
}

const rows = Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).map(([id, v]) => `  ${JSON.stringify(id)}: { app: "${v.app}", hero: "${v.hero}" },`);
const localRows = Object.entries(LOCAL).map(([id, v]) => `  ${JSON.stringify(id)}: { cover: "${v.cover}", hero: "${v.hero}" },`);
writeFileSync(new URL("../src/data/artMap.ts", import.meta.url), `// GENERATED by scripts/build-art-map.mjs — do not edit by hand. Re-run it when the game list changes.
// Verified against Steam: an entry exists only where Steam's title for the app matches the game's title.
export type SteamArt = { app: string; hero: "library_hero" | "header" };

export const STEAM_ART: Record<string, SteamArt> = {
${rows.join("\n")}
};

// Artwork that ships with the site (public/).
export const LOCAL_ART: Record<string, { cover: string; hero: string }> = {
${localRows.join("\n")}
};
`);
console.log(log.join("\n"));
console.log(`\n${Object.keys(map).length} games with verified Steam art, ${Object.keys(LOCAL).length} local, of ${catalog.filter((g) => g.category === "game").length} games`);

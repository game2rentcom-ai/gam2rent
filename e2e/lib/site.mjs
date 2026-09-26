// Test harness for the storefront: builds the site in a chosen configuration and serves the build
// straight from disk into a real browser (no server is started — requests are answered by the test).
// Supabase, WhatsApp and the image optimiser are faked, so the tests run offline and deterministically.
import { spawnSync } from "node:child_process";
import { readFileSync, statSync } from "node:fs";
import { dirname, extname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import sharp from "sharp";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const WEB = join(ROOT, "..", "apps", "web");
export const ORIGIN = "http://gamebuy.test";
export const MOCK_SUPABASE = "https://mock.supabase.test";

const TYPES = { ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".woff": "font/woff", ".html": "text/html", ".jpg": "image/jpeg", ".txt": "text/plain" };

/** Builds apps/web with the given environment into e2e/.dist/<name>; blank values really are blank. */
export function build(name, env) {
  const out = join(ROOT, ".dist", name);
  const result = spawnSync(`npx vite build --outDir "${out}" --emptyOutDir`, { cwd: WEB, shell: true, env: { ...process.env, ...env }, encoding: "utf8" });
  if (result.status !== 0) throw new Error(`build "${name}" failed:\n${result.stdout}\n${result.stderr}`);
  return out;
}

/** The three configurations the storefront runs in. */
export const VARIANTS = {
  // A configured database (faked): real prices, plans, reviews and settings come from `rest`.
  live: { VITE_SUPABASE_URL: MOCK_SUPABASE, VITE_SUPABASE_ANON_KEY: "anon-test-key", VITE_WHATSAPP_NUMBER: "911111111111", VITE_DEMO_DATA: "false" },
  // Nothing configured: the honest empty store.
  bare: { VITE_SUPABASE_URL: "", VITE_SUPABASE_ANON_KEY: "", VITE_WHATSAPP_NUMBER: "", VITE_DEMO_DATA: "false" },
};

const catalogModule = pathToFileURL(join(WEB, "src", "data", "catalog.ts")).href;
export const { catalog } = await import(catalogModule);

/** The database's rows for the games table, as PostgREST would return them. */
export const gameRows = [
  ...catalog.map((g) => ({
    id: g.id, title: g.title, category: g.category, genre: g.genre, platforms: g.platforms, franchise: g.franchise,
    developer: g.developer, publisher: g.publisher, release_info: g.releaseInfo, description: g.description,
    cover_url: null, hero_url: null, is_published: true, is_rentable: true,
  })),
  // A game the owner added in the admin panel — it is not in the built-in list.
  {
    id: "admin-added", title: "Owner Added Game", category: "game", genre: "Puzzle", platforms: ["pc", "ps5"], franchise: "Owner Added Game",
    developer: "Indie Studio", publisher: "Indie Studio", release_info: "2025", description: "A game the owner added from the admin panel.",
    cover_url: "https://img.mock.test/owner-cover.png", hero_url: null, is_published: true, is_rentable: true,
  },
];

/** A standard faked database: two listings (one unavailable), rental plans, reviews, settings. */
export const defaultRest = {
  games: gameRows,
  listings: [
    { game_id: "gta-5", platform: "ps4", price: 999, credential_type: "id_password", delivery_eta_minutes: 45, is_available: true, is_featured: true, compare_at_price: 1299 },
    { game_id: "god-of-war", platform: "pc", price: 799, credential_type: "qr_code", delivery_eta_minutes: 60, is_available: false, is_featured: false, compare_at_price: null },
  ],
  reviews: [
    { id: "r1", game_id: "gta-5", rating: 5, comment: "Worked first time.", reviewer_name: "Asha" },
    { id: "r2", game_id: "gta-5", rating: 4, comment: "Took about 40 minutes.", reviewer_name: null },
  ],
  rental_offers: [
    { game_id: "gta-5", plan_id: "p1", label: "1 day", days: 1, tag: null, is_popular: false, sort_order: 1, price: 100 },
    { game_id: "gta-5", plan_id: "p3", label: "3 days", days: 3, tag: "Weekend", is_popular: true, sort_order: 2, price: 250 },
    { game_id: "gta-5", plan_id: "p7", label: "7 days", days: 7, tag: null, is_popular: false, sort_order: 3, price: 500 },
  ],
  site_settings: [
    { key: "announcement", value: "Sale this weekend" },
    { key: "contact_whatsapp", value: "919999988888" },
  ],
};

const optimiserCache = new Map();
async function optimise(url, steam) {
  const src = url.searchParams.get("url");
  const width = Number(url.searchParams.get("w"));
  const key = `${src}|${width}`;
  if (!optimiserCache.has(key)) {
    const remote = /^https?:/.test(src);
    const stubbed = remote && (steam === "stub" || new URL(src).hostname === "img.mock.test");
    const original = stubbed ? PIXEL : remote ? Buffer.from(await (await fetch(src)).arrayBuffer()) : readFileSync(join(WEB, "public", src));
    optimiserCache.set(key, await sharp(original).resize({ width, withoutEnlargement: true }).webp({ quality: 75 }).toBuffer());
  }
  return optimiserCache.get(key);
}
const PIXEL = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", "base64");

/**
 * Opens a page on a built site.
 *  rest        — the faked database (tables -> rows); unknown tables answer []\n *  backend     — a full fake Supabase (see mock-backend.mjs): login, real database rules, storage, functions
 *  optimiser   — "sharp" resizes like Vercel does; "fail" makes it error, to test the fallback
 *  requests    — every request the page made (url + kind), for "did it load X?" assertions
 */
export async function openSite(browser, { dist, viewport, mobile = false, rest = defaultRest, optimiser = "sharp", steam = "stub", backend = null }) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile });
  const page = await context.newPage();
  const errors = [];
  const requests = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("request", (r) => requests.push(new URL(r.url())));

  await context.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (url.hostname === "wa.me") return route.fulfill({ status: 200, body: "chat" });
    if (url.host === new URL(MOCK_SUPABASE).host) {
      if (backend) return backend.handle(route);
      const table = url.pathname.replace("/rest/v1/", "");
      return route.fulfill({ status: 200, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: JSON.stringify(rest[table] ?? []) });
    }
    if (url.origin === ORIGIN && url.pathname === "/_vercel/image") {
      if (optimiser === "fail") return route.fulfill({ status: 500, body: "" });
      try {
        return await route.fulfill({ status: 200, contentType: "image/webp", body: await optimise(url, steam) });
      } catch {
        return route.fulfill({ status: 502, body: "" });
      }
    }
    if (url.origin === ORIGIN) {
      let file = join(dist, decodeURIComponent(url.pathname));
      let isFile = false;
      try { isFile = statSync(file).isFile(); } catch { /* not a file: the SPA answers */ }
      if (!isFile) file = join(dist, "index.html");
      return route.fulfill({ status: 200, contentType: TYPES[extname(file)] ?? "application/octet-stream", body: readFileSync(file) });
    }
    if (url.hostname === "img.mock.test") return route.fulfill({ status: 200, contentType: "image/png", body: PIXEL });
    if (url.hostname === "shared.akamai.steamstatic.com" && steam === "live") return route.continue();
    if (url.hostname === "shared.akamai.steamstatic.com") return route.fulfill({ status: 200, contentType: "image/png", body: PIXEL });
    if (/youtube|ytimg|google/.test(url.hostname)) return route.fulfill({ status: 200, contentType: "text/html", body: "<html></html>" });
    return route.continue();
  });

  const goto = async (path) => {
    await page.goto(ORIGIN + path, { waitUntil: "networkidle" });
    await page.waitForTimeout(300);
  };
  return { page, context, errors, requests, goto, close: () => context.close() };
}

export const PHONE = { viewport: { width: 390, height: 844 }, mobile: true };
export const SMALL_PHONE = { viewport: { width: 360, height: 740 }, mobile: true };
export const TABLET = { viewport: { width: 768, height: 1024 }, mobile: true };
export const DESKTOP = { viewport: { width: 1280, height: 800 }, mobile: false };

/** Fills in and submits the login form; the caller waits for wherever the visitor should end up. */
export async function fillLogin({ page, goto }, email, password = "password123", from = "/login") {
  await goto(from);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
}

/** The mobile quality rules, checked on whatever the page currently shows: returns a list of problems (empty = fine). */
export async function mobileProblems(page) {
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 700) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); }
    window.scrollTo(0, 0);
  });
  return page.evaluate(() => {
    const out = [];
    if (document.documentElement.scrollWidth > window.innerWidth + 1) out.push(`sideways scroll: ${document.documentElement.scrollWidth} > ${window.innerWidth}`);
    const visible = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none"; };
    for (const el of document.querySelectorAll("a[href], button, input, select, textarea, summary, [role=tab], [role=radio]")) {
      if (!visible(el) || el.closest(".sr-only") || el.classList.contains("sr-only")) continue;
      // A checkbox is tapped through its label row, so that is the target to measure.
      const target = el.matches("input[type=checkbox], input[type=radio]") ? el.closest("label") ?? el : el;
      const r = target.getBoundingClientRect();
      if (r.height < 40 || r.width < 40) out.push(`small target ${Math.round(r.width)}x${Math.round(r.height)}: ${(target.innerText || el.getAttribute("aria-label") || el.tagName).trim().slice(0, 30)}`);
    }
    for (const el of document.querySelectorAll("body *")) {
      if (!visible(el) || ![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1)) continue;
      if (parseFloat(getComputedStyle(el).fontSize) < 12) out.push(`tiny text ${getComputedStyle(el).fontSize}: ${el.textContent.trim().slice(0, 30)}`);
    }
    return out;
  });
}

// What a visitor actually sees, in a real browser: real data only, search, filters, the buy bar,
// images and their fallbacks, routing, and the mobile quality rules (no sideways scroll, comfortable
// tap targets, readable text). Run with: npm test  (inside e2e/)
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { after, before, test } from "node:test";
import { chromium } from "playwright";
import { DESKTOP, ORIGIN, PHONE, SMALL_PHONE, TABLET, VARIANTS, build, defaultRest, gameRows, mobileProblems, openSite } from "../lib/site.mjs";

let browser;
let live;
let bare;
before(async () => {
  live = build("live", VARIANTS.live);
  bare = build("bare", VARIANTS.bare);
  browser = await chromium.launch();
});
after(() => browser.close());

const withSite = async (options, run) => {
  const site = await openSite(browser, { steam: "stub", ...options });
  try {
    await run(site);
  } finally {
    await site.close();
  }
};
const pageText = (page) => page.evaluate(() => document.body.innerText);
// Filters are driven by the URL, which the router commits a moment after a tap: assert with retries.
async function eventually(read, pattern, ms = 3000) {
  const until = Date.now() + ms;
  let last;
  while (Date.now() < until) {
    last = await read();
    if (pattern.test(last)) return;
    await new Promise((r) => setTimeout(r, 50));
  }
  assert.match(last, pattern);
}
const whatsappText = (href) => new URL(href).searchParams.get("text");
// Titles whose real details were never confirmed are kept from customers until the owner fills them in.
const PLACEHOLDERS = gameRows.filter((g) => g.genre === "Unverified");
const SHOWN = gameRows.length - PLACEHOLDERS.length;

test("home shows only real data: prices, delivery time, reviews and the owner's banner come from the database", async () => {
  await withSite({ dist: live, ...PHONE }, async ({ page, goto, errors }) => {
    await goto("/");
    const text = await pageText(page);
    assert.match(text, /Sale this weekend/);
    assert.match(text, /Available now/);
    assert.match(text, /₹999/);
    assert.match(text, /Typical delivery ~45 min/);
    assert.match(text, /4\.5 from 2 verified reviews/);
    assert.equal(await page.getByPlaceholder(`Search ${SHOWN} games`).count() > 0, true, "the count is the database's, including the owner's added game but not the placeholder titles");
    for (const invented of [/1,400/, /Shaurya/, /LIVE ACTIVITY/, /Instant digital/i, /₹49\b/]) assert.doesNotMatch(text, invented);
    await page.getByRole("button", { name: "Dismiss announcement" }).click();
    assert.doesNotMatch(await pageText(page), /Sale this weekend/);
    assert.deepEqual(errors, []);
  });
});

test("with nothing configured the store is honest: browsable, no prices, no reviews, no contact links", async () => {
  await withSite({ dist: bare, ...PHONE }, async ({ page, goto }) => {
    await goto("/");
    const text = await pageText(page);
    assert.doesNotMatch(text, /₹/);
    assert.doesNotMatch(text, /Available now|verified review|Typical delivery|Demo/i);
    assert.equal(await page.getByRole("link", { name: "Chat" }).count(), 0, "no contact number, no chat link");
    await goto("/games/gta-5");
    const cta = page.getByText("Check availability").last();
    assert.equal(await page.locator('a[href*="wa.me"]').count(), 0);
    assert.equal(await cta.isVisible(), true);
    assert.match(await pageText(page), /Contact details aren’t set up yet/);
  });
});

test("phone search: forgiving of typos, opens full-screen, Enter goes to the results", async () => {
  await withSite({ dist: live, ...PHONE }, async ({ page, goto }) => {
    await goto("/");
    await page.getByRole("navigation", { name: "Main" }).getByRole("button", { name: "Search" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.waitFor();
    assert.match(await dialog.innerText(), /Popular searches/, "helpful before typing");
    const box = await dialog.getByRole("searchbox").boundingBox();
    assert.ok(box.y < 200, "the field sits at the top, clear of the on-screen keyboard");
    await dialog.getByRole("searchbox").fill("cybrpunk");
    await dialog.getByRole("link", { name: /Cyberpunk 2077/ }).waitFor();
    await dialog.getByRole("searchbox").press("Enter");
    await page.waitForURL(/\/browse\?q=cybrpunk/);
    assert.equal(await page.getByRole("dialog").count(), 0, "the sheet closes on navigation");
    assert.ok((await page.locator("article", { hasText: "Cyberpunk 2077" }).count()) >= 1);
  });
});

test("browse: platform chips, filter sheet, sort and 'show more' all work and live in the URL", async () => {
  await withSite({ dist: live, ...PHONE }, async ({ page, goto, errors }) => {
    await goto("/browse");
    const count = () => page.locator('p[aria-live="polite"]').innerText();
    assert.match(await count(), new RegExp(`^${SHOWN} games`));
    assert.equal(await page.locator("article").count(), 24, "a first page, not all of them at once");
    await page.getByRole("button", { name: "Show more games" }).click();
    assert.equal(await page.locator("article").count(), 48);

    const ps5 = gameRows.filter((g) => g.platforms.includes("ps5")).length;
    await page.getByRole("button", { name: "PS5", exact: true }).click();
    await eventually(count, new RegExp(`^${ps5} games`));
    assert.match(page.url(), /platform=ps5/);

    await page.getByRole("button", { name: /^Filters/ }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("checkbox", { name: /available to buy/i }).click();
    await page.waitForURL(/forsale=1/);
    await dialog.getByRole("button", { name: /^Show \d+ games?$/ }).click();
    await eventually(count, /^1 game/);
    assert.match(page.url(), /forsale=1/);

    await page.getByRole("button", { name: /^Filters/ }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Reset" }).click();
    await page.getByRole("dialog").getByRole("button", { name: /^Show/ }).click();
    await page.getByRole("button", { name: "All", exact: true }).click();
    await page.getByRole("button", { name: /^Filters/ }).click();
    await page.getByRole("dialog").getByLabel("Sort by").selectOption("price-high");
    await page.getByRole("dialog").getByRole("button", { name: /^Show/ }).click();
    await eventually(() => page.locator("article").first().innerText(), /GTA 5/);
    await page.getByRole("button", { name: /^Filters/ }).click();
    await page.getByRole("dialog").getByLabel("Sort by").selectOption("price-low");
    await page.getByRole("dialog").getByRole("button", { name: /^Show/ }).click();
    await eventually(() => page.locator("article").first().innerText(), /God of War/);
    assert.deepEqual(errors, []);
  });
});

test("browse: Back from a game lands where the visitor left — the same games shown, at the same place on the page", async () => {
  await withSite({ dist: live, ...PHONE }, async ({ page, goto }) => {
    await goto("/browse");
    await page.getByRole("button", { name: "Show more games" }).click();
    assert.equal(await page.locator("article").count(), 48);
    await page.evaluate(() => window.scrollTo(0, 2500));
    await page.waitForTimeout(300);
    const left = await page.evaluate(() => window.scrollY);
    assert.ok(left > 2000, "scrolled well down the list");

    // Open a game that is already on screen (so opening it doesn't move the page first).
    const onScreen = await page.evaluate(() => [...document.querySelectorAll("article a")].findIndex((a) => { const r = a.getBoundingClientRect(); return r.top > 120 && r.bottom < window.innerHeight - 20; }));
    assert.ok(onScreen >= 0);
    await page.locator("article a").nth(onScreen).click();
    await page.waitForURL(/\/games\//);
    await page.waitForTimeout(200);
    assert.equal(await page.evaluate(() => window.scrollY), 0, "a new page starts at the top");

    await page.goBack();
    await page.waitForFunction(() => document.querySelectorAll("article").length === 48);
    await page.waitForTimeout(400);
    const back = await page.evaluate(() => window.scrollY);
    assert.ok(Math.abs(back - left) < 150, `back at ${back}, left at ${left}`);
  });
});

test("browse search box keeps up with fast typing, and the URL follows once you pause", async () => {
  await withSite({ dist: live, ...PHONE }, async ({ page, goto }) => {
    await goto("/browse");
    const box = page.getByRole("searchbox", { name: "Search games" }).last();
    await box.pressSequentially("elden ring", { delay: 15 });
    assert.equal(await box.inputValue(), "elden ring", "no dropped or reordered characters");
    await page.waitForURL(/q=elden\+ring|q=elden%20ring/);
    await eventually(() => page.locator("article").first().innerText(), /Elden Ring/);
    await page.getByRole("button", { name: "Clear search" }).click();
    assert.equal(await box.inputValue(), "");
    await eventually(() => page.locator('p[aria-live="polite"]').innerText(), new RegExp(`^${SHOWN} games`));
  });
});

test("a listed game: real price, was-price, delivery time, rental plans, and chat links carry the choice", async () => {
  await withSite({ dist: live, ...PHONE }, async ({ page, goto, errors }) => {
    await goto("/games/gta-5");
    let text = await pageText(page);
    assert.match(text, /₹999/);
    assert.match(text, /₹1,299/);
    assert.match(text, /Delivered in ~45 min/);
    assert.match(text, /4\.5\s*\(2 verified reviews\)/);
    assert.match(text, /Asha/);
    assert.equal(await page.getByRole("navigation", { name: "Main" }).count(), 0, "the bottom nav makes way for the buy bar");

    const buy = page.getByRole("link", { name: /Buy now/ });
    assert.ok((await buy.getAttribute("href")).startsWith("https://wa.me/919999988888"), "the owner's number from Settings beats the build-time default");
    assert.match(whatsappText(await buy.getAttribute("href")), /BUY "GTA 5".*₹999/);

    await page.getByRole("tab", { name: "Rent" }).click();
    assert.equal(await page.getByRole("radio").count(), 3, "the plans the owner priced");
    text = await pageText(page);
    assert.match(text, /Weekend/);
    assert.match(await page.getByRole("link", { name: /Rent · 3 days/ }).innerText(), /Rent · 3 days/, "the popular plan is preselected");
    await page.getByRole("radio", { name: /7 days/ }).click();
    const rent = page.getByRole("link", { name: /Rent · 7 days/ });
    assert.match(whatsappText(await rent.getAttribute("href")), /7 days for ₹500/);
    await page.getByRole("button", { name: "PS5", exact: true }).click();
    assert.match(whatsappText(await rent.getAttribute("href")), /PS5/);
    assert.deepEqual(errors, []);
  });
});

test("an unlisted game invents nothing; an unavailable one can't be bought", async () => {
  await withSite({ dist: live, ...PHONE }, async ({ page, goto }) => {
    await goto("/games/astro-bot");
    assert.equal(await page.getByRole("tablist").count(), 0, "no Buy/Rent choice when neither has a price");
    const panel = await page.getByRole("complementary", { name: "Buy or rent" }).innerText();
    assert.doesNotMatch(panel, /₹/);
    assert.match(panel, /isn’t listed with a price yet/);
    const check = page.getByRole("link", { name: "Check availability" });
    assert.match(whatsappText(await check.getAttribute("href")), /Is "Astro Bot" available to buy\?/);

    await goto("/games/god-of-war");
    const unavailable = page.getByText("Currently unavailable").last();
    assert.equal(await unavailable.getAttribute("aria-disabled"), "true");
    assert.equal(await page.locator('a[href*="wa.me"]').filter({ hasText: /Buy now/ }).count(), 0);
  });
});

test("titles whose real details were never confirmed stay out of the store until the owner fills them in", async () => {
  assert.ok(PLACEHOLDERS.length > 0, "the built-in list still contains placeholder titles, so this test has something to hide");
  await withSite({ dist: live, ...PHONE }, async ({ page, goto }) => {
    const { id, title } = PLACEHOLDERS[0];
    await goto(`/games/${id}`);
    assert.match(await pageText(page), /Page not found/);
    assert.doesNotMatch(await pageText(page), /UNVERIFIED/);
    await goto(`/browse?q=${encodeURIComponent(title)}`);
    assert.doesNotMatch(await pageText(page), /UNVERIFIED/);
    assert.equal(await page.locator("article", { hasText: title }).count(), 0);
  });
});

test("the price area holds its place while prices load, and offers Try again if they can't", async () => {
  await withSite({ dist: live, ...PHONE }, async ({ page, context }) => {
    let held = true;
    let release;
    const gate = new Promise((resolve) => { release = resolve; });
    await context.route("**/rest/v1/listings*", async (route) => {
      await gate;
      if (held) return route.fulfill({ status: 500, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: "{}" });
      return route.fallback();
    });
    await page.goto(`${ORIGIN}/games/gta-5`, { waitUntil: "commit" });
    await page.getByLabel("Loading price").first().waitFor();
    assert.doesNotMatch(await page.getByRole("complementary", { name: "Buy or rent" }).innerText(), /isn’t listed with a price yet/, "never says 'no price' while it doesn't know yet");

    release(); // the database answers — with an error
    await page.getByText("We couldn’t load the price just now.").waitFor();
    assert.doesNotMatch(await pageText(page), /isn’t listed with a price yet/, "a failed load is not the same as no price");
    held = false;
    await page.getByRole("button", { name: "Try again" }).first().click();
    await page.getByText("₹999").first().waitFor();
  });
});

test("every page names itself in the tab and in its description", async () => {
  await withSite({ dist: live, ...PHONE }, async ({ page, goto }) => {
    const meta = () => page.evaluate(() => ({ title: document.title, description: document.querySelector('meta[name="description"]').content }));
    await goto("/");
    assert.doesNotMatch((await meta()).title, / · /, "home is just the shop's name");
    await goto("/browse");
    assert.match((await meta()).title, /^Browse games · /);
    await goto("/games/gta-5");
    let now = await meta();
    assert.match(now.title, /^GTA 5 — buy or rent · /);
    assert.ok(now.description.length > 20 && now.description.length <= 160, "a description sized for search results");
    await goto("/policies/refund");
    assert.match((await meta()).title, /^Refund & Replacement Policy · /);
    await goto("/policies/constructor");
    now = await meta();
    assert.match(now.title, /^Page not found · /);
    assert.match(await pageText(page), /Page not found/, "an odd policy name is a 404, not a crash");
    await goto("/games/no-such-game");
    assert.match((await meta()).title, /^Page not found · /);
  });
});

test("the two vercel.json files (repository root and apps/web) say the same about headers, and the browser-protection headers are there", () => {
  const read = (relative) => JSON.parse(readFileSync(new URL(relative, import.meta.url), "utf8"));
  const root = read("../../vercel.json");
  const web = read("../../apps/web/vercel.json");
  assert.deepEqual(root.headers, web.headers, "whichever folder Vercel is pointed at, the visitor gets the same headers");
  assert.deepEqual(root.images, web.images);
  const headers = Object.fromEntries(root.headers[0].headers.map((h) => [h.key, h.value]));
  assert.equal(headers["X-Frame-Options"], "DENY");
  assert.match(headers["Permissions-Policy"], /camera=\(\)/);
  const csp = headers["Content-Security-Policy-Report-Only"];
  for (const needed of ["https://checkout.razorpay.com", "https://*.supabase.co", "https://www.youtube-nocookie.com", "frame-src https://api.razorpay.com"]) assert.ok(csp.includes(needed), `the policy allows ${needed}, or payment/login/trailers would be reported`);
});

test("the trailer costs nothing until it is tapped", async () => {
  await withSite({ dist: live, ...PHONE }, async ({ page, goto, requests }) => {
    await goto("/games/cyberpunk-2077");
    assert.equal(await page.locator("iframe").count(), 0);
    assert.equal(requests.some((u) => /youtube|google/.test(u.hostname)), false, "no third-party request before the tap");
    await page.getByRole("button", { name: /Play trailer/ }).click();
    const frame = page.locator("iframe");
    await frame.waitFor();
    assert.match(await frame.getAttribute("src"), /^https:\/\/www\.youtube-nocookie\.com\/embed\/qIcTM8WXFjk/);
  });
});

test("images: sized by the optimiser, falling back to the original if it fails, generated art when there is none", async () => {
  await withSite({ dist: live, ...PHONE }, async ({ page, goto }) => {
    await goto("/browse");
    const first = page.locator("article img").first();
    assert.match(await first.getAttribute("src"), /^\/_vercel\/image\?url=.+&w=\d+&q=75$/);
    assert.match(await first.getAttribute("srcset"), /240w.*360w.*480w/s, "candidates for small and sharp screens");
    const generated = page.locator("article", { hasText: "Alan Wake 2" });
    assert.equal(await generated.locator("img").count(), 0, "Alan Wake 2 isn't on Steam: generated art, never another game's poster");
    assert.equal(await page.locator('article img[src*="images.unsplash"]').count(), 0, "no stock photos");
  });
  await withSite({ dist: live, optimiser: "fail", ...PHONE }, async ({ page, goto }) => {
    await goto("/browse");
    const onScreen = () => [...document.images].filter((i) => i.getBoundingClientRect().top < window.innerHeight);
    await page.waitForFunction((fn) => { const imgs = (new Function(`return (${fn})()`))(); return imgs.length > 0 && imgs.every((i) => i.complete && i.naturalWidth > 0); }, onScreen.toString());
    const sources = await page.evaluate((fn) => (new Function(`return (${fn})()`))().map((i) => i.currentSrc), onScreen.toString());
    assert.ok(sources.length > 0 && sources.every((s) => !s.includes("_vercel")), "a broken optimiser never blanks the page");
  });
  await withSite({ dist: live, ...PHONE }, async ({ page, goto }) => {
    await goto("/games/admin-added");
    assert.match(await pageText(page), /A game the owner added from the admin panel/);
    assert.match(await page.locator("main img").first().getAttribute("src"), /owner-cover\.png/, "the owner's uploaded image is used");
  });
});

test("routing: old links redirect, unknown pages are friendly, pages start at the top, policies stay neutral", async () => {
  await withSite({ dist: live, ...PHONE }, async ({ page, goto }) => {
    await goto("/game/gta-5");
    assert.match(page.url(), /\/games\/gta-5$/);
    await goto("/no-such-page");
    assert.match(await pageText(page), /Page not found/);
    await page.getByRole("link", { name: "Browse games" }).click();
    await page.waitForURL(/\/browse/);
    await goto("/policies/terms");
    const text = await pageText(page);
    assert.match(text, /Platform rules and risk/);
    assert.doesNotMatch(text, /being finalised|decision-log|placeholder|\[[A-Z][^\]]*\]/i, "no draft markers or internal notes on a public page");
    await goto("/browse");
    await page.evaluate(() => window.scrollTo(0, 1200));
    await page.locator("article a").nth(3).click();
    await page.waitForURL(/\/games\//);
    await page.waitForTimeout(200);
    assert.equal(await page.evaluate(() => window.scrollY), 0);
  });
});

test("policy pages: real content on every page, filled with the owner's saved details, never with gaps or draft markers", async () => {
  const details = [
    { key: "business_name", value: "Test Traders" },
    { key: "support_email", value: "help@example.test" },
    { key: "grievance_officer", value: "Asha Rao, Proprietor" },
  ];
  await withSite({ dist: live, ...PHONE, rest: { ...defaultRest, site_settings: [...defaultRest.site_settings, ...details] } }, async ({ page, goto }) => {
    for (const [slug, title] of [["terms", "Terms of Service"], ["privacy", "Privacy Policy"], ["refund", "Refund & Replacement Policy"], ["shipping", "Delivery Times"], ["contact", "Contact us"]]) {
      await goto(`/policies/${slug}`);
      assert.equal(await page.getByRole("heading", { level: 1 }).innerText(), title);
      const text = await pageText(page);
      assert.match(text, /Last updated 26 September 2026/);
      assert.doesNotMatch(text, /being finalised|placeholder|\{\w+\}|\[[A-Z][^\]]*\]|undefined/i, `${slug}: no unfilled markers`);
    }

    await goto("/policies/terms");
    let text = await pageText(page);
    assert.match(text, /run by Test Traders/);
    assert.match(text, /Grievance Officer \(Asha Rao, Proprietor\) at help@example\.test/);
    assert.match(text, /at least 18 years old/);

    await goto("/policies/refund");
    text = await pageText(page);
    assert.match(text, /replacement guarantee for 30 days from delivery/);
    assert.match(text, /still undelivered 24 hours after payment/);

    // The contact page lists only what the owner has entered: the email, not a GSTIN or address nobody set.
    await goto("/policies/contact");
    text = await pageText(page);
    assert.match(text, /Business name: Test Traders/);
    assert.match(text, /Email: help@example\.test/);
    assert.match(text, /WhatsApp: \+91 99999 88888/);
    assert.doesNotMatch(text, /GSTIN|Registered address/);

    // Without saved details the pages still read naturally.
    await withSite({ dist: live, ...PHONE }, async (bare) => {
      await bare.goto("/policies/privacy");
      const plain = await pageText(bare.page);
      assert.match(plain, /this store runs this website/);
      assert.match(plain, /Grievance Officer \(the store owner\)/);
    });
  });
});

for (const [name, size] of [["360px phone", SMALL_PHONE], ["390px phone", PHONE], ["768px tablet", TABLET]]) {
  test(`mobile quality at ${name}: no sideways scroll, comfortable tap targets, readable text`, async () => {
    await withSite({ dist: live, ...size }, async ({ page, goto }) => {
      for (const path of ["/", "/browse", "/games/gta-5", "/games/astro-bot", "/policies/terms"]) {
        await goto(path);
        const problems = await mobileProblems(page);
        assert.deepEqual(problems, [], `${path}: ${problems.join(" | ")}`);
      }
    });
  });
}

test("layout adapts: phone 2 columns, tablet 4, desktop shows the panel beside the game and the search in the header", async () => {
  const columns = async (page) => page.locator("article").evaluateAll((cards) => new Set(cards.slice(0, 12).filter((c) => c.getBoundingClientRect().top === cards[0].getBoundingClientRect().top).map((c) => c.getBoundingClientRect().left)).size);
  await withSite({ dist: live, ...PHONE }, async ({ page, goto }) => { await goto("/browse"); assert.equal(await columns(page), 2); });
  await withSite({ dist: live, ...TABLET }, async ({ page, goto }) => { await goto("/browse"); assert.equal(await columns(page), 4); });
  await withSite({ dist: live, ...DESKTOP }, async ({ page, goto }) => {
    await goto("/games/gta-5");
    const panel = await page.getByRole("complementary", { name: "Buy or rent" }).boundingBox();
    assert.ok(panel.x > 800, "the buy panel is a right-hand column");
    assert.equal(await page.getByRole("link", { name: /Buy now/ }).count(), 1, "one Buy button on desktop: in the panel, not a second sticky bar");
    assert.equal(await page.getByRole("navigation", { name: "Main" }).count(), 0);
    assert.ok(await page.getByRole("searchbox", { name: "Search games" }).first().isVisible(), "search lives in the header");
    const header = await page.getByRole("link", { name: "Message us" }).first().getAttribute("href");
    assert.ok(header.startsWith("https://wa.me/919999988888"));
  });
});

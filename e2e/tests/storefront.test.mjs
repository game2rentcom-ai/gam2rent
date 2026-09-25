// What a visitor actually sees, in a real browser: real data only, search, filters, the buy bar,
// images and their fallbacks, routing, and the mobile quality rules (no sideways scroll, comfortable
// tap targets, readable text). Run with: npm test  (inside e2e/)
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { chromium } from "playwright";
import { DESKTOP, PHONE, SMALL_PHONE, TABLET, VARIANTS, build, gameRows, openSite } from "../lib/site.mjs";

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

test("home shows only real data: prices, delivery time, reviews and the owner's banner come from the database", async () => {
  await withSite({ dist: live, ...PHONE }, async ({ page, goto, errors }) => {
    await goto("/");
    const text = await pageText(page);
    assert.match(text, /Sale this weekend/);
    assert.match(text, /Available now/);
    assert.match(text, /₹999/);
    assert.match(text, /Typical delivery ~45 min/);
    assert.match(text, /4\.5 from 2 verified reviews/);
    assert.equal(await page.getByPlaceholder("Search 117 games").count() > 0, true, "the count is the database's, including the owner's added game");
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
    assert.match(await count(), /^117 games/);
    assert.equal(await page.locator("article").count(), 24, "a first page, not all 117 at once");
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
    await eventually(() => page.locator('p[aria-live="polite"]').innerText(), /^117 games/);
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
    assert.match(text, /being finalised/);
    assert.doesNotMatch(text, /Razorpay|decision-log|placeholder/i);
    await goto("/browse");
    await page.evaluate(() => window.scrollTo(0, 1200));
    await page.locator("article a").nth(3).click();
    await page.waitForURL(/\/games\//);
    await page.waitForTimeout(200);
    assert.equal(await page.evaluate(() => window.scrollY), 0);
  });
});

for (const [name, size] of [["360px phone", SMALL_PHONE], ["390px phone", PHONE], ["768px tablet", TABLET]]) {
  test(`mobile quality at ${name}: no sideways scroll, comfortable tap targets, readable text`, async () => {
    await withSite({ dist: live, ...size }, async ({ page, goto }) => {
      for (const path of ["/", "/browse", "/games/gta-5", "/games/astro-bot", "/policies/terms"]) {
        await goto(path);
        await page.evaluate(async () => {
          for (let y = 0; y < document.body.scrollHeight; y += 700) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); }
          window.scrollTo(0, 0);
        });
        const problems = await page.evaluate(() => {
          const out = [];
          if (document.documentElement.scrollWidth > window.innerWidth + 1) out.push(`sideways scroll: ${document.documentElement.scrollWidth} > ${window.innerWidth}`);
          const visible = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none"; };
          for (const el of document.querySelectorAll("a[href], button, input, select, textarea, summary, [role=tab], [role=radio]")) {
            if (!visible(el) || el.closest(".sr-only") || el.classList.contains("sr-only")) continue;
            const r = el.getBoundingClientRect();
            if (r.height < 40 || r.width < 40) out.push(`small target ${Math.round(r.width)}x${Math.round(r.height)}: ${(el.innerText || el.getAttribute("aria-label") || el.tagName).trim().slice(0, 30)}`);
          }
          for (const el of document.querySelectorAll("body *")) {
            if (!visible(el) || ![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1)) continue;
            if (parseFloat(getComputedStyle(el).fontSize) < 12) out.push(`tiny text ${getComputedStyle(el).fontSize}: ${el.textContent.trim().slice(0, 30)}`);
          }
          return out;
        });
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

// One game, several platforms: GTA V sold permanently on PS4 and PS5 at their own prices and rented by the
// hour on PC; the owner choosing which platforms rent; and the home-page announcement slider. A real browser
// against the faked Supabase that runs the real database rules. Needs the private supabase/ folder next to
// e2e/ (skipped without it). The tests build on each other, in order.
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { chromium } from "playwright";
import { DESKTOP, PHONE, VARIANTS, build, fillLogin, mobileProblems, openSite } from "../lib/site.mjs";
import { backendAvailable, installFakeRazorpay, startBackend } from "../lib/mock-backend.mjs";

const suite = backendAvailable ? test : test.skip;

let browser;
let dist;
let backend;
before(async () => {
  if (!backendAvailable) return;
  dist = build("platforms", VARIANTS.live);
  backend = await startBackend();
  browser = await chromium.launch();
  await backend.db.exec(`
    insert into public.listings (game_id, platform, price, delivery_eta_minutes, credential_type) values
      ('gta-5', 'ps4', 999, 45, 'id_password'),
      ('gta-5', 'ps5', 1499, 45, 'id_password');
    insert into public.rental_plans (label, hours, price, sort_order) values
      ('1 hour', 1, 49, 1), ('24 hours', 24, 149, 2), ('7 days', 168, 599, 3), ('30 days', 720, 1499, 4);
    insert into public.site_settings (key, value) values ('payments_enabled', to_jsonb('true'::text))
      on conflict (key) do update set value = excluded.value;
  `);
});
after(() => browser?.close());

const withSite = async (options, run) => {
  const site = await openSite(browser, { dist, backend, ...options });
  await installFakeRazorpay(site.page, backend);
  try {
    await run(site);
  } finally {
    await site.close();
  }
};
const text = (page) => page.evaluate(() => document.body.innerText);
const platformChip = (page, name) => page.getByRole("radiogroup", { name: "Platform" }).getByRole("radio", { name: new RegExp(`^${name}`) });

suite("GTA V: pick a platform. PS4 and PS5 are bought permanently at their own prices, PC is rented by the hour", async () => {
  await withSite(DESKTOP, async ({ page, goto, errors }) => {
    await goto("/games/gta-5");
    const chips = page.getByRole("radiogroup", { name: "Platform" });
    await chips.waitFor();
    const labels = await chips.getByRole("radio").allInnerTexts();
    assert.deepEqual(labels.map((l) => l.replace(/\s+/g, " ").trim()), ["PC Rental", "PS4 Permanent", "PS5 Permanent", "Cloud Gaming Ask us"]);

    // Opens on the cheapest platform on sale.
    assert.equal(await platformChip(page, "PS4").getAttribute("aria-checked"), "true");
    await page.getByRole("button", { name: /Buy now · ₹999/ }).waitFor();
    await platformChip(page, "PS5").click();
    await page.getByRole("button", { name: /Buy now · ₹1,499/ }).waitFor();
    assert.match(await text(page), /PS5 · yours to keep/);
    assert.equal(await page.getByRole("radiogroup", { name: "Rental length" }).count(), 0, "PS5 is not rented");

    await platformChip(page, "PC").click();
    const plans = page.getByRole("radiogroup", { name: "Rental length" });
    await plans.waitFor();
    assert.deepEqual((await plans.getByRole("radio").allInnerTexts()).map((t) => t.split("\n")[0]), ["1 hour", "24 hours", "7 days", "30 days"]);
    await plans.getByRole("radio", { name: /1 hour/ }).click();
    await page.getByRole("button", { name: /Rent · 1 hour · ₹49/ }).waitFor();
    assert.deepEqual(errors, []);
  });
});

suite("buying the PS5 version: the cart, the order and the price are all PS5's", async () => {
  await withSite(DESKTOP, async (site) => {
    const { page, goto } = site;
    await fillLogin(site, "customer@example.test");
    await page.getByRole("link", { name: "Account", exact: true }).first().waitFor();
    await goto("/games/gta-5");
    await platformChip(page, "PS5").click();
    await page.getByRole("button", { name: /Buy now · ₹1,499/ }).click();
    await page.waitForURL((u) => u.pathname === "/cart");
    await page.getByText("Buy · PS5 · permanent").waitFor();
    assert.equal((await backend.query("select platform from public.cart_items where game_id = 'gta-5'"))[0].platform, "ps5");
    const quote = (await backend.as("authenticated", backend.accounts.get("customer@example.test").id, () => backend.query("select public.quote_cart(null) as q")))[0].q;
    assert.deepEqual([quote.items[0].platform, quote.items[0].unit_price], ["ps5", 1499]);
    await backend.query("delete from public.cart_items");
  });
});

suite("the owner chooses where a game rents: GTA V on PS5 too, then only PS5", async () => {
  await withSite(DESKTOP, async (site) => {
    const { page, goto } = site;
    await fillLogin(site, "admin@example.test");
    await page.waitForURL((u) => u.pathname === "/account");
    await goto("/admin/games/gta-5");
    const rentPs5 = page.getByRole("checkbox", { name: "Rent on PS5" });
    await rentPs5.waitFor();
    assert.equal(await page.getByRole("checkbox", { name: "Rent on PC" }).isChecked(), true, "PC rents by default");
    await rentPs5.check();
    await page.getByRole("checkbox", { name: "Rent on PC" }).uncheck();
    await page.getByRole("button", { name: "Save changes" }).click();
    await page.getByText("Saved", { exact: false }).first().waitFor();
    const row = (await backend.query("select is_rentable, rental_platforms from public.games where id = 'gta-5'"))[0];
    assert.deepEqual([row.is_rentable, row.rental_platforms], [true, ["ps5"]]);
  });
  await withSite(DESKTOP, async ({ page, goto }) => {
    await goto("/games/gta-5");
    await platformChip(page, "PS5").waitFor();
    assert.match(await platformChip(page, "PS5").innerText(), /Buy or rent/);
    assert.match(await platformChip(page, "PC").innerText(), /Ask us/);
    await platformChip(page, "PS5").click();
    await page.getByRole("tab", { name: "Rent" }).click();
    await page.getByRole("radiogroup", { name: "Rental length" }).waitFor();
  });
  await backend.query("update public.games set rental_platforms = null where id = 'gta-5'");
});

suite("announcements: the owner adds slides; the home page shows live ones above the search, with a countdown, and they move", async () => {
  await withSite(DESKTOP, async (site) => {
    const { page, goto } = site;
    await fillLogin(site, "admin@example.test");
    await page.waitForURL((u) => u.pathname === "/account");
    await goto("/admin/announcements");
    const form = page.getByRole("form", { name: "Add a slide" });
    await form.getByLabel("Headline").fill("GTA 6 is coming");
    await form.getByLabel("Line under it").fill("Pre-book now and play on day one");
    await form.getByLabel("Button text").fill("See GTA 6");
    await form.getByLabel("Button goes to").fill("javascript:alert(1)");
    await form.getByRole("button", { name: "Add slide" }).click();
    await form.getByText(/must be a page on the store/).waitFor();
    await form.getByLabel("Button goes to").fill("/games/gta-6");
    await form.getByRole("button", { name: "Add slide" }).click();
    await page.getByRole("form", { name: "Slide GTA 6 is coming" }).waitFor();
  });
  await backend.db.exec(`
    update public.announcements set countdown_to = now() + interval '3 days 4 hours' where title = 'GTA 6 is coming';
    insert into public.announcements (title, subtitle, sort_order) values ('Weekend offer', '20% off every rental', 5);
    insert into public.announcements (title, ends_at, sort_order) values ('Finished offer', now() - interval '1 hour', 6);
  `);

  await withSite(DESKTOP, async ({ page, goto, errors }) => {
    await goto("/");
    const slider = page.getByRole("region", { name: "Announcements" });
    await slider.waitFor();
    const order = await page.evaluate(() => {
      const s = document.querySelector('[aria-roledescription="carousel"]');
      const h1 = [...document.querySelectorAll("h1")].find((h) => h.textContent.includes("Find your next game"));
      return s.compareDocumentPosition(h1) & Node.DOCUMENT_POSITION_FOLLOWING;
    });
    assert.ok(order, "the slider sits above the search hero");
    // Hidden slides are inert, so count the slide elements rather than what assistive tech sees.
    assert.equal(await slider.locator('[aria-roledescription="slide"]').count(), 2, "the finished offer is not shown");
    assert.equal(await slider.getByRole("group").count(), 1, "only the visible slide is reachable");
    await slider.getByRole("heading", { name: "GTA 6 is coming" }).waitFor();
    assert.match(await slider.getByRole("timer").getAttribute("aria-label"), /^3 days [34] hours/);

    await page.mouse.move(5, 5);
    await slider.getByRole("heading", { name: "Weekend offer" }).waitFor({ timeout: 9000 });

    await slider.getByRole("button", { name: "Show announcement 1" }).click();
    await slider.getByRole("link", { name: "See GTA 6" }).click();
    await page.waitForURL((u) => u.pathname === "/games/gta-6");
    assert.deepEqual(errors, []);
  });

  await withSite(PHONE, async ({ page, goto }) => {
    await goto("/");
    await page.getByRole("region", { name: "Announcements" }).waitFor();
    assert.deepEqual(await mobileProblems(page), []);
  });
});

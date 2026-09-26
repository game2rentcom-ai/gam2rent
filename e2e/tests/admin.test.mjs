// The owner's admin panel, in a real browser against a faked Supabase that enforces the real database
// rules: who may get in, and that everything the owner edits (games, pictures, prices, rental plans,
// settings, reviews) is saved to the database and shows up on the storefront. Needs the private
// supabase/ folder next to e2e/ (skipped without it). The tests build on each other, in order.
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { chromium } from "playwright";
import { DESKTOP, PHONE, SMALL_PHONE, VARIANTS, build, catalog, fillLogin, mobileProblems, openSite } from "../lib/site.mjs";
import { backendAvailable, startBackend } from "../lib/mock-backend.mjs";

const suite = backendAvailable ? test : test.skip;
const PIXEL = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", "base64");
const GTA = catalog.find((g) => g.id === "gta-5");

let browser;
let dist;
let backend;
before(async () => {
  if (!backendAvailable) return;
  dist = build("admin", VARIANTS.live);
  backend = await startBackend();
  browser = await chromium.launch();
});
after(() => browser?.close());

const withSite = async (options, run) => {
  const site = await openSite(browser, { dist, backend, ...options });
  try {
    await run(site);
  } finally {
    await site.close();
  }
};
/** Opens the site as the owner, already logged in and on the admin panel. */
const asOwner = async (options, run) =>
  withSite(options, async (site) => {
    await fillLogin(site, "admin@example.test");
    await site.page.waitForURL((u) => u.pathname === "/account");
    await site.goto("/admin");
    await site.page.getByRole("heading", { name: "Overview" }).waitFor();
    await run(site);
  });
const pageText = (page) => page.evaluate(() => document.body.innerText);
const path = (page) => new URL(page.url()).pathname;
const saved = (page, text = "Saved.") => page.getByText(text, { exact: true }).first().waitFor();
const settingsRows = async () => Object.fromEntries((await backend.query("select key, value #>> '{}' as value from public.site_settings")).map((r) => [r.key, r.value]));

suite("only the owner gets in: customers and visitors are turned away, and the database refuses their writes", async () => {
  await withSite(DESKTOP, async (site) => {
    const { page, goto } = site;
    await goto("/admin");
    assert.equal(path(page) + new URL(page.url()).search, "/login?next=%2Fadmin", "a visitor is asked to log in first");

    await fillLogin(site, "customer@example.test", "password123", "/admin");
    await page.getByRole("heading", { name: "Admins only" }).waitFor();
    assert.equal(path(page), "/admin");
    assert.equal(await page.getByRole("link", { name: "Admin", exact: true }).count(), 0, "no Admin link for a customer");

    // The screen check is a courtesy: the database is what protects the data.
    const attempts = await page.evaluate(async () => {
      const key = Object.keys(localStorage).find((k) => k.endsWith("-auth-token"));
      const token = JSON.parse(localStorage.getItem(key)).access_token;
      const call = async (url, init) => {
        const response = await fetch(`https://mock.supabase.test${url}`, { ...init, headers: { apikey: "anon-test-key", authorization: `Bearer ${token}`, "content-type": "application/json", prefer: "return=representation", ...init.headers } });
        return { ok: response.ok };
      };
      return {
        rename: await call("/rest/v1/games?id=eq.gta-5", { method: "PATCH", body: JSON.stringify({ title: "Hacked" }) }),
        price: await call("/rest/v1/listings", { method: "POST", body: JSON.stringify({ game_id: "gta-5", platform: "pc", price: 1, credential_type: "id_password", delivery_eta_minutes: 5 }) }),
        setting: await call("/rest/v1/site_settings", { method: "POST", body: JSON.stringify({ key: "announcement", value: "Hacked" }) }),
        upload: await call("/storage/v1/object/game-media/games/evil.png", { method: "POST", body: "x", headers: { "content-type": "image/png" } }),
      };
    });
    assert.equal(attempts.price.ok, false);
    assert.equal(attempts.setting.ok, false);
    assert.equal(attempts.upload.ok, false);
    assert.equal((await backend.query("select title from public.games where id = 'gta-5'"))[0].title, GTA.title, "the game was not renamed");
    assert.equal((await backend.query("select count(*)::int as n from public.listings"))[0].n, 0);
    assert.equal((await settingsRows()).announcement, undefined);
    assert.equal([...backend.files.keys()].some((k) => k.includes("evil")), false);
  });

  await asOwner(DESKTOP, async ({ page }) => {
    assert.ok(await page.getByRole("link", { name: "Admin", exact: true }).isVisible(), "the owner sees the Admin link");
    const text = await pageText(page);
    assert.match(text, /Set your contact number/);
    assert.match(text, new RegExp(`GAMES\\s+${catalog.length}\\b`), "the overview counts the games in the store");
  });
});

suite("adding a game: checked, saved with an uploaded picture, live on the store; then edited, hidden and deleted", async () => {
  await asOwner(DESKTOP, async ({ page, goto }) => {
    await goto("/admin/games/new");
    await page.getByLabel("Title", { exact: true }).fill("QA Test Game");
    await page.getByRole("button", { name: "Add game" }).click();
    await page.getByText("Choose at least one platform.").waitFor();

    await page.getByRole("checkbox", { name: "PC", exact: true }).check();
    await page.getByRole("checkbox", { name: "PS5", exact: true }).check();
    await page.getByLabel("Genre").fill("Puzzle");
    await page.getByLabel("Description").fill("A test game the owner added.");

    await page.getByText("Or paste a picture address").last().click();
    await page.getByLabel("Banner (wide) address").fill("http://insecure.example/banner.png");
    await page.getByRole("button", { name: "Add game" }).click();
    await page.getByText("Picture addresses must start with https://").waitFor();
    await page.getByLabel("Banner (wide) address").fill("");

    await page.getByLabel("Cover (tall) file", { exact: true }).setInputFiles({ name: "cover.png", mimeType: "image/png", buffer: PIXEL });
    await page.getByAltText("Cover (tall) preview").waitFor();
    await page.getByRole("button", { name: "Add game" }).click();
    await page.waitForURL((u) => u.pathname === "/admin/games/qa-test-game");
    await page.getByRole("heading", { name: "QA Test Game" }).waitFor();

    const [row] = await backend.query("select title, genre, platforms, cover_url, is_published from public.games where id = 'qa-test-game'");
    assert.equal(row.title, "QA Test Game");
    assert.deepEqual([...row.platforms].sort(), ["pc", "ps5"]);
    assert.equal(row.is_published, true);
    assert.match(row.cover_url, /^https:\/\/mock\.supabase\.test\/storage\/v1\/object\/public\/game-media\/games\/qa-test-game\/cover-\d+\.png$/);
    assert.ok([...backend.files.keys()].some((k) => /^game-media\/games\/qa-test-game\/cover-\d+\.png$/.test(k)), "the picture is in storage");

    // The store shows it, with the owner's picture.
    await goto("/games/qa-test-game");
    const text = await pageText(page);
    assert.match(text, /QA Test Game/);
    assert.match(text, /A test game the owner added\./);
    assert.match(decodeURIComponent(await page.locator("main img").first().getAttribute("src")), /games\/qa-test-game\/cover-\d+\.png/);

    // Edit the description.
    await goto("/admin/games/qa-test-game");
    await page.getByLabel("Description").fill("Now with a better description.");
    await page.getByRole("button", { name: "Save changes" }).click();
    await saved(page);
    await goto("/games/qa-test-game");
    assert.match(await pageText(page), /Now with a better description\./);

    // Hide it: it disappears from the store but stays in the admin list, under "Hidden".
    await goto("/admin/games/qa-test-game");
    await page.getByRole("switch", { name: "Shown on the store" }).click();
    await page.getByRole("button", { name: "Save changes" }).click();
    await saved(page);
    await goto("/games/qa-test-game");
    await page.getByRole("heading", { name: "Page not found" }).waitFor();
    await goto("/admin/games");
    await page.getByRole("button", { name: "Hidden" }).click();
    await page.getByRole("link", { name: /QA Test Game/ }).waitFor();

    // Delete it.
    await page.getByRole("link", { name: /QA Test Game/ }).click();
    await page.getByRole("button", { name: "Delete…" }).click();
    await page.getByRole("button", { name: "Yes, delete it" }).click();
    await page.waitForURL((u) => u.pathname === "/admin/games");
    assert.equal((await backend.query("select count(*)::int as n from public.games where id = 'qa-test-game'"))[0].n, 0);
  });
});

suite("buy prices: added, validated, edited and removed — the store follows each change", async () => {
  await asOwner(DESKTOP, async ({ page, goto }) => {
    await goto("/games/gta-5");
    assert.match(await pageText(page), /This game isn’t listed with a price yet/, "no price until the owner sets one");

    await goto("/admin/pricing");
    await page.getByRole("heading", { name: "0 games with a price" }).waitFor();
    await page.getByRole("button", { name: "Add price" }).click();
    await page.getByText("Choose a game.").waitFor();
    await page.getByLabel("Find a game").fill(GTA.title);
    await page.getByLabel("Game", { exact: true }).selectOption("gta-5");
    await page.getByLabel("Price (₹)").fill("11.99");
    await page.getByRole("button", { name: "Add price" }).click();
    await page.getByText("Enter the price in whole rupees.").waitFor();
    await page.getByLabel("Price (₹)").fill("1199");
    await page.getByLabel("Delivery time (minutes)").fill("30");
    await page.getByRole("button", { name: "Add price" }).click();
    await page.getByRole("heading", { name: "1 game with a price" }).waitFor();

    await goto("/games/gta-5");
    let text = await pageText(page);
    assert.match(text, /₹1,199/);
    assert.match(text, /Delivered in ~30 min/);
    assert.match(text, /Buy now/);

    // Edit: a "was" price lower than the price is refused; a proper one shows struck through.
    await goto("/admin/pricing");
    const row = page.getByRole("listitem").filter({ hasText: GTA.title });
    await row.getByLabel("Was (₹)").fill("500");
    await row.getByRole("button", { name: "Save", exact: true }).click();
    await row.getByText("The “was” price can’t be lower than the price.").waitFor();
    await row.getByLabel("Price (₹)").fill("999");
    await row.getByLabel("Was (₹)").fill("1499");
    await row.getByRole("button", { name: "Save", exact: true }).click();
    await saved(page);
    assert.deepEqual((await backend.query("select price, compare_at_price from public.listings where game_id = 'gta-5'"))[0], { price: 999, compare_at_price: 1499 });
    await goto("/games/gta-5");
    text = await pageText(page);
    assert.match(text, /₹999/);
    assert.match(text, /₹1,499/);

    // Mark it unavailable: the store says so and offers no buy button.
    await goto("/admin/pricing");
    await page.getByRole("listitem").filter({ hasText: GTA.title }).getByRole("switch", { name: "Available to buy" }).click();
    await page.getByRole("listitem").filter({ hasText: GTA.title }).getByRole("button", { name: "Save", exact: true }).click();
    await saved(page);
    await goto("/games/gta-5");
    assert.match(await pageText(page), /Currently unavailable/);

    // Remove the price.
    await goto("/admin/pricing");
    await page.getByRole("button", { name: "Remove price" }).click();
    await page.getByRole("button", { name: "Yes, remove it" }).click();
    await page.getByRole("heading", { name: "0 games with a price" }).waitFor();
    await goto("/games/gta-5");
    assert.match(await pageText(page), /This game isn’t listed with a price yet/);
  });
});

suite("rental plans and per-game rental prices: the store shows the plan price unless the game has its own", async () => {
  await asOwner(DESKTOP, async ({ page, goto }) => {
    await goto("/admin/pricing");
    await page.getByRole("button", { name: "Rental plans" }).click();
    await page.getByRole("heading", { name: "0 plans" }).waitFor();

    const add = page.getByRole("form", { name: "Add a plan" });
    await add.getByRole("button", { name: "Add plan" }).click();
    await add.getByText(/Give the plan a name/).waitFor();
    await add.getByLabel("Name").fill("1 day");
    await add.getByLabel("Days").fill("1");
    await add.getByLabel("Price (₹)").fill("120");
    await add.getByRole("button", { name: "Add plan" }).click();
    await page.getByRole("heading", { name: "1 plan" }).waitFor();

    const addAgain = page.getByRole("form", { name: "Add a plan" });
    await addAgain.getByLabel("Name").fill("3 days");
    await addAgain.getByLabel("Days").fill("3");
    await addAgain.getByLabel("Price (₹)").fill("300");
    await addAgain.getByLabel("Tag").fill("Weekend");
    await addAgain.getByRole("button", { name: "Add plan" }).click();
    await page.getByRole("heading", { name: "2 plans" }).waitFor();

    await goto("/games/god-of-war");
    await page.getByRole("radio", { name: /1 day/ }).waitFor();
    let text = await pageText(page);
    assert.match(text, /₹120/);
    assert.match(text, /₹300/);
    assert.match(text, /Weekend/);

    // A price for one game only.
    await goto("/admin/pricing");
    await page.getByRole("button", { name: "Rental price by game" }).click();
    await page.getByLabel("Game", { exact: true }).selectOption("gta-5");
    await page.getByLabel("3 days (₹)").fill("450");
    await page.getByRole("button", { name: "Save prices for this game" }).click();
    await saved(page);
    await goto("/games/gta-5");
    text = await pageText(page);
    assert.match(text, /₹450/, "this game has its own 3-day price");
    assert.match(text, /₹120/, "the 1-day price is still the plan's");
    await goto("/games/god-of-war");
    assert.match(await pageText(page), /₹300/, "other games keep the plan's price");

    // Switch a plan off: the store stops offering it.
    await goto("/admin/pricing");
    await page.getByRole("button", { name: "Rental plans" }).click();
    const oneDay = page.getByRole("form", { name: "Plan 1 day" });
    await oneDay.getByRole("switch", { name: "Offered on the store" }).click();
    await oneDay.getByRole("button", { name: "Save", exact: true }).click();
    await saved(page);
    await goto("/games/god-of-war");
    await page.getByRole("radio", { name: /3 days/ }).waitFor();
    assert.equal(await page.getByRole("radio", { name: /1 day/ }).count(), 0);
  });
});

suite("settings: the banner, contact number and payments switch are saved and used by the storefront", async () => {
  await asOwner(DESKTOP, async ({ page, goto }) => {
    await goto("/admin/settings");
    await page.getByLabel("Banner text").fill("Free replacement guarantee");
    await page.getByLabel("WhatsApp number").fill("12");
    await page.getByLabel("Support email").fill("nope");
    await page.getByRole("button", { name: "Save settings" }).click();
    await page.getByText(/Enter a WhatsApp number with the country code/).waitFor();
    await page.getByText("Enter a valid email address.").waitFor();

    await page.getByLabel("WhatsApp number").fill("98765 43210");
    await page.getByLabel("Support email").fill("help@example.test");
    await page.getByLabel("Business name").fill("Test Traders");
    await page.getByLabel("Grievance Officer").fill("Asha Rao, Proprietor");
    await page.getByRole("switch", { name: "Take payments online" }).click();
    await page.getByRole("button", { name: "Save settings" }).click();
    await page.getByText(/Settings saved/).waitFor();

    const settings = await settingsRows();
    assert.equal(settings.announcement, "Free replacement guarantee");
    assert.equal(settings.contact_whatsapp, "919876543210", "stored as digits with the country code");
    assert.equal(settings.support_email, "help@example.test");
    assert.equal(settings.grievance_officer, "Asha Rao, Proprietor");
    assert.equal(settings.payments_enabled, "true");

    // The details the owner saved are what the public legal pages show.
    await goto("/policies/contact");
    let legal = await pageText(page);
    assert.match(legal, /Business name: Test Traders/);
    assert.match(legal, /Grievance Officer: Asha Rao, Proprietor, at help@example\.test/);
    await goto("/policies/terms");
    legal = await pageText(page);
    assert.match(legal, /run by Test Traders/);
    await page.getByRole("link", { name: "Contact us" }).first().waitFor();

    await goto("/");
    assert.match(await pageText(page), /Free replacement guarantee/);
    const chat = await page.getByRole("link", { name: "Message us" }).first().getAttribute("href");
    assert.ok(chat.startsWith("https://wa.me/919876543210"), "the header chat link uses the number saved by the owner");

    // Clearing the banner removes it.
    await goto("/admin/settings");
    assert.equal(await page.getByLabel("WhatsApp number").inputValue(), "+91 98765 43210");
    await page.getByLabel("Banner text").fill("");
    await page.getByRole("button", { name: "Save settings" }).click();
    await page.getByText(/Settings saved/).waitFor();
    await page.getByRole("button", { name: "Save settings" }).click();
    await page.getByText(/Nothing to save/).waitFor();
    assert.equal((await settingsRows()).announcement, undefined);
    await goto("/");
    assert.doesNotMatch(await pageText(page), /Free replacement guarantee/);
  });
});

suite("reviews: an owner-added review appears on the store, can be hidden and deleted", async () => {
  await asOwner(DESKTOP, async ({ page, goto }) => {
    await goto("/admin/reviews");
    await page.getByText("0 in total").waitFor();
    await page.getByRole("button", { name: "Add review" }).click();
    await page.getByText("Choose the game.").waitFor();
    await page.getByLabel("Game", { exact: true }).selectOption("gta-5");
    await page.getByRole("button", { name: "Add review" }).click();
    await page.getByText("Enter what the customer said.").waitFor();
    await page.getByLabel("Rating").selectOption("4");
    await page.getByLabel("Customer’s first name").fill("Karan");
    await page.getByLabel("What they said").fill("Delivered in 20 minutes.");
    await page.getByRole("button", { name: "Add review" }).click();
    await page.getByText("1 in total").waitFor();

    await goto("/games/gta-5");
    let text = await pageText(page);
    assert.match(text, /4\.0/);
    assert.match(text, /1 verified review/);
    assert.match(text, /Delivered in 20 minutes\./);

    await goto("/admin/reviews");
    await page.getByRole("switch", { name: "Show on the store" }).click();
    await page.getByText("Not shown").waitFor();
    await goto("/games/gta-5");
    text = await pageText(page);
    assert.doesNotMatch(text, /verified review/);
    assert.doesNotMatch(text, /Delivered in 20 minutes/);

    await goto("/admin/reviews");
    await page.getByRole("button", { name: "Delete…" }).click();
    await page.getByRole("button", { name: "Yes, delete it" }).click();
    await page.getByText("0 in total").waitFor();
  });
});

suite("team: an admin can add another (who must already have an account) and remove them, never themselves; it is on the record", async () => {
  await asOwner(DESKTOP, async ({ page, goto }) => {
    await goto("/admin/team");
    await page.getByRole("heading", { name: "Team" }).waitFor();
    await page.getByText("a@x").waitFor();
    assert.equal(await page.getByRole("button", { name: /Remove…/ }).count(), 0, "no way to remove yourself");

    await page.getByLabel("Add an admin by email").fill("nobody@example.test");
    await page.getByRole("button", { name: "Add admin" }).click();
    await page.getByText(/There is no account with that email/).waitFor();

    await page.getByLabel("Add an admin by email").fill("O@X");
    await page.getByRole("button", { name: "Add admin" }).click();
    await page.getByText(/Added — they can open the admin area now/).waitFor();
    await page.getByText("o@x", { exact: true }).waitFor();
    const other = backend.accounts.get("other@example.test").id;
    assert.equal((await backend.query("select count(*)::int as n from public.admins where user_id = $1", [other]))[0].n, 1);

    await page.getByRole("button", { name: "Remove…" }).click();
    await page.getByRole("button", { name: "Yes, remove" }).click();
    await page.getByText("Removed.").waitFor();
    assert.equal((await backend.query("select count(*)::int as n from public.admins where user_id = $1", [other]))[0].n, 0);

    await goto("/admin/audit");
    const text = await pageText(page);
    assert.match(text, /ADD_ADMIN\s+admins · o@x/);
    assert.match(text, /REMOVE_ADMIN\s+admins · o@x/);
  });
});

suite("history records who changed what, written by the database", async () => {
  await asOwner(DESKTOP, async ({ page, goto }) => {
    await goto("/admin/audit");
    await page.getByRole("heading", { name: "History" }).waitFor();
    const text = await pageText(page);
    for (const entry of ["games · QA Test Game", "listings · gta-5", "rental_plans · 3 days", "game_rental_prices · gta-5", "site_settings · announcement", "reviews · gta-5"]) assert.ok(text.includes(entry), `history mentions ${entry}`);
    await page.locator("summary").filter({ hasText: "site_settings · announcement" }).first().click();
    assert.match(await pageText(page), /Free replacement guarantee/, "an entry shows what the value was");
  });
});

for (const size of [SMALL_PHONE, PHONE]) {
  suite(`admin screens follow the mobile rules at ${size.viewport.width}px: no sideways scroll, comfortable taps, readable text`, async () => {
    await asOwner(size, async ({ page, goto }) => {
      // Give the pages something to show: a price, a plan, a review.
      await backend.query("insert into public.listings (game_id, platform, price, delivery_eta_minutes, credential_type) values ('gta-5', 'pc', 999, 30, 'id_password') on conflict do nothing");
      await backend.query("insert into public.reviews (game_id, rating, comment, verified) values ('gta-5', 5, 'Great.', true)");
      for (const route of ["/admin", "/admin/games", "/admin/games/gta-5", "/admin/games/new", "/admin/pricing", "/admin/reviews", "/admin/settings", "/admin/audit"]) {
        await goto(route);
        await page.getByRole("navigation", { name: "Admin" }).waitFor();
        await page.waitForFunction(() => !document.querySelector("[aria-busy=true]"));
        const problems = await mobileProblems(page);
        assert.deepEqual(problems, [], `${route}: ${problems.join(" | ")}`);
      }
      await goto("/admin/pricing");
      for (const tab of ["Rental plans", "Rental price by game"]) {
        await page.getByRole("button", { name: tab }).click();
        await page.waitForFunction(() => !document.querySelector("[aria-busy=true]"));
        const problems = await mobileProblems(page);
        assert.deepEqual(problems, [], `pricing / ${tab}: ${problems.join(" | ")}`);
      }
    });
  });
}

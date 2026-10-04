// Shopping, in a real browser against a faked Supabase that enforces the real database rules and runs the
// real payment functions against a fake Razorpay: the wishlist, the cart, coupons, paying, the order and
// receipt pages — and that nothing changes for shoppers while online ordering is switched off. Needs the
// private supabase/ folder next to e2e/ (skipped without it). The tests build on each other, in order.
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { chromium } from "playwright";
import { DESKTOP, PHONE, SMALL_PHONE, VARIANTS, build, catalog, fillLogin, mobileProblems, openSite } from "../lib/site.mjs";
import { backendAvailable, installFakeRazorpay, startBackend } from "../lib/mock-backend.mjs";

const suite = backendAvailable ? test : test.skip;
const GTA = catalog.find((g) => g.id === "gta-5");
const GOW = catalog.find((g) => g.id === "god-of-war");

let browser;
let dist;
let backend;
let firstOrder; // the order the checkout test creates, reused by the later tests
before(async () => {
  if (!backendAvailable) return;
  dist = build("shop", VARIANTS.live);
  backend = await startBackend();
  browser = await chromium.launch();
  await backend.db.exec(`
    insert into public.listings (game_id, platform, price, delivery_eta_minutes, credential_type) values
      ('gta-5', '${GTA.platforms[0]}', 1000, 45, 'id_password'),
      ('god-of-war', '${GOW.platforms[0]}', 1500, 60, 'qr_code');
    insert into public.rental_plans (label, hours, price, sort_order) values ('1 day', 24, 120, 1), ('3 days', 72, 300, 2);
    insert into public.coupons (code, discount_type, discount_value, description) values
      ('SAVE10', 'percent', 10, '10% off'), ('FREE', 'flat', 100000, null);
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
const path = (page) => new URL(page.url()).pathname;
const one = async (sql, params) => (await backend.query(sql, params))[0];
const customerId = () => backend.accounts.get("customer@example.test").id;
const switchOrderingOn = () => backend.query("insert into public.site_settings (key, value) values ('payments_enabled', to_jsonb('true'::text)) on conflict (key) do update set value = excluded.value");
const signIn = async (site, email = "customer@example.test") => {
  await fillLogin(site, email);
  // exact: on the login page "Create an account" would also match, before anyone is signed in
  await site.page.getByRole("link", { name: "Account", exact: true }).first().waitFor();
};

suite("while online ordering is off nothing changes: Buy opens a chat, there is no cart", async () => {
  await withSite(DESKTOP, async (site) => {
    const { page, goto } = site;
    await goto("/games/gta-5");
    assert.match(await page.getByRole("link", { name: /Buy now/ }).getAttribute("href"), /^https:\/\/wa\.me\//);
    assert.equal(await page.getByRole("button", { name: "Add to cart" }).count(), 0);
    assert.equal(await page.getByRole("link", { name: /^Cart/ }).count(), 0, "no cart icon");

    await signIn(site);
    await goto("/cart");
    await page.getByRole("heading", { name: "Ordering opens soon" }).waitFor();
    await goto("/account");
    await page.getByRole("heading", { name: "My account" }).waitFor();
    assert.equal(await page.getByRole("link", { name: /My orders/ }).count(), 0);
    assert.ok(await page.getByRole("link", { name: /My wishlist/ }).isVisible(), "the wishlist doesn't depend on online ordering");
  });
});

suite("wishlist: a signed-out heart leads to login and back; saving and removing persist and show on the wishlist page", async () => {
  await withSite(DESKTOP, async (site) => {
    const { page, goto, errors } = site;
    await goto("/games/gta-5");
    await page.getByRole("link", { name: /Log in to save .* to your wishlist/ }).click();
    await page.waitForURL((u) => u.pathname === "/login" && u.searchParams.get("next") === "/games/gta-5");
    await page.getByLabel("Email").fill("customer@example.test");
    await page.getByLabel("Password", { exact: true }).fill("password123");
    await page.getByRole("button", { name: "Log in" }).click();
    await page.waitForURL((u) => u.pathname === "/games/gta-5");

    const heart = page.getByRole("button", { name: `Save ${GTA.title} to your wishlist` });
    await heart.click();
    await page.getByRole("button", { name: `Remove ${GTA.title} from your wishlist` }).waitFor();
    assert.equal((await backend.query("select game_id from public.wishlist_items where user_id = $1", [customerId()])).map((r) => r.game_id).join(), "gta-5");

    await goto("/account");
    await page.getByRole("link", { name: "My wishlist (1)" }).click();
    await page.getByRole("heading", { name: "My wishlist" }).waitFor();
    assert.match(await text(page), new RegExp(GTA.title));
    await page.getByRole("button", { name: `Remove ${GTA.title} from your wishlist` }).click();
    await page.getByText("Tap the heart on a game to save it here.").waitFor();
    assert.equal((await backend.query("select count(*)::int as n from public.wishlist_items where user_id = $1", [customerId()]))[0].n, 0);
    assert.deepEqual(errors, []);
  });
});

suite("cart and checkout: server-priced, coupons, paying through Razorpay, then the order and receipt", async () => {
  await switchOrderingOn();
  await withSite(DESKTOP, async (site) => {
    const { page, goto, errors } = site;
    // Signed out, "Buy now" asks for login and brings the visitor back to the game.
    await goto("/games/gta-5");
    await page.getByRole("button", { name: /Buy now/ }).click();
    await page.waitForURL((u) => u.pathname === "/login" && u.searchParams.get("next") === "/games/gta-5");
    await page.getByLabel("Email").fill("customer@example.test");
    await page.getByLabel("Password", { exact: true }).fill("password123");
    await page.getByRole("button", { name: "Log in" }).click();
    await page.waitForURL((u) => u.pathname === "/games/gta-5");

    await page.getByRole("button", { name: /Buy now/ }).click();
    await page.getByRole("heading", { name: "Your cart" }).waitFor();
    assert.equal(path(page), "/cart");
    let body = await text(page);
    assert.match(body, new RegExp(GTA.title));
    assert.match(body, /Pay ₹1,000/);
    assert.match(body, /Delivery usually takes ~45 min/);

    // A second game, added from its page without leaving it.
    await goto("/games/god-of-war");
    await page.getByRole("button", { name: "Add to cart" }).click();
    await page.getByRole("link", { name: /In your cart/ }).waitFor();
    await page.getByRole("link", { name: "Cart, 2 games" }).click();
    await page.getByText("Pay ₹2,500").waitFor();

    // Coupons: a wrong code is explained; a right one is priced by the database.
    await page.getByLabel("Coupon code").fill("nope");
    await page.getByRole("button", { name: "Apply" }).click();
    await page.getByText(/This code isn.t valid/).waitFor();
    await page.getByLabel("Coupon code").fill("save10");
    await page.getByRole("button", { name: "Apply" }).click();
    await page.getByText(/Code SAVE10 applied — you save ₹250/).waitFor();
    await page.getByText("Pay ₹2,250").waitFor();

    // Remove one game: the total follows.
    await page.getByRole("button", { name: `Remove ${GOW.title}` }).click();
    await page.getByText("Pay ₹900").waitFor();

    // Pay. The payment window is asked for exactly what the database priced; the browser sent no price.
    await page.getByRole("button", { name: "Pay ₹900" }).click();
    await page.getByRole("heading", { name: /^Order GB-\d{4}-\d{6}$/ }).waitFor();
    firstOrder = path(page).split("/").pop();
    const asked = await page.evaluate(() => window.__razorpayOptions);
    assert.equal(asked.amount, 90000, "Razorpay was asked for exactly the database's total, in paise");
    body = await text(page);
    assert.match(body, /Paid/);
    assert.match(body, /Discount \(SAVE10\)/);
    assert.match(body, /Receipt GB-\d{4}-\d{6}/);
    assert.match(body, /Payment received/);
    await page.getByRole("link", { name: "Cart", exact: true }).waitFor(); // no count: the cart is empty again

    const order = await one("select status, subtotal, discount, total, coupon_code, payment_source, razorpay_payment_id from public.orders where id = $1", [firstOrder]);
    assert.deepEqual([order.status, order.subtotal, order.discount, order.total, order.coupon_code, order.payment_source], ["paid", 1000, 100, 900, "SAVE10", "razorpay"]);
    assert.match(order.razorpay_payment_id, /^pay_test_/);
    assert.equal((await backend.query("select title, unit_price from public.order_items where order_id = $1", [firstOrder]))[0].title, GTA.title);
    assert.equal((await backend.query("select count(*)::int as n from public.cart_items where user_id = $1", [customerId()]))[0].n, 0);
    assert.equal((await backend.query("select count(*)::int as n from public.coupon_redemptions where order_id = $1", [firstOrder]))[0].n, 1);

    await goto("/account/orders");
    body = await text(page);
    assert.match(body, /GB-\d{4}-\d{6}/);
    assert.match(body, new RegExp(GTA.title));
    assert.deepEqual(errors, []);
  });
});

suite("if the payment functions aren't deployed yet, checkout says so and offers WhatsApp instead of a dead end", async () => {
  await withSite(DESKTOP, async (site) => {
    const { page, goto } = site;
    await signIn(site);
    // Supabase's own answer for a function that doesn't exist (ours always carry an `error` code).
    await page.route("**/functions/v1/create-payment", (route) => route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ code: "NOT_FOUND", message: "Requested function was not found" }) }));
    await goto("/games/god-of-war");
    await page.getByRole("button", { name: /Buy now/ }).click();
    await page.getByText("Pay ₹1,500").waitFor();
    await page.getByRole("button", { name: "Pay ₹1,500" }).click();
    await page.getByText(/Online payment isn’t available right now/).waitFor();
    assert.match(await page.getByRole("link", { name: "Order on WhatsApp", exact: true }).getAttribute("href"), /^https:\/\/wa\.me\//);
    assert.equal((await backend.query("select count(*)::int as n from public.orders where user_id = $1 and status = 'pending_payment'", [customerId()]))[0].n, 0, "no half-made order was left behind");
  });
});

suite("if our confirmation fails after the customer has paid, they are told not to pay again and the order updates by itself", async () => {
  await withSite(DESKTOP, async (site) => {
    const { page, goto } = site;
    await signIn(site);
    await backend.query("delete from public.cart_items where user_id = $1", [customerId()]); // an earlier test leaves a game in the cart
    await page.route("**/functions/v1/verify-payment", (route) => route.abort());
    await goto("/games/gta-5");
    await page.getByRole("tab", { name: "Rent" }).click();
    await page.getByRole("radio", { name: /3 days/ }).click();
    await page.getByRole("button", { name: /Rent · 3 days · ₹300/ }).click();
    await page.getByText("Pay ₹300").waitFor();
    await page.getByRole("button", { name: "Pay ₹300" }).click();

    // Not "couldn't reach the server", and no Pay button to press twice: straight to the order.
    await page.getByRole("heading", { name: /^Order #[0-9A-F]{8}$/ }).waitFor();
    await page.getByText(/Your payment went through and is being confirmed/).waitFor();
    assert.match(await text(page), /Please don’t pay again/);
    assert.equal(await page.getByRole("button", { name: /^Pay/ }).count(), 0);
    const orderId = path(page).split("/").pop();
    const order = await one("select status, razorpay_order_id, total from public.orders where id = $1", [orderId]);
    assert.equal(order.status, "pending_payment", "our own confirmation never arrived");

    // Razorpay's message to the server lands; the page notices within a few seconds.
    const payment = Object.values(backend.razorpay.state.payments).find((p) => p.order_id === order.razorpay_order_id);
    await backend.query("select public.mark_order_paid($1, $2, $3, $4, null)", [order.razorpay_order_id, payment.id, order.total * 100, `evt_late_${payment.id}`]);
    await page.getByText(/Payment received/).waitFor({ timeout: 15000 });
    assert.doesNotMatch(await text(page), /Please don’t pay again/);
  });
});

suite("closing the payment window charges nothing and keeps the cart; trying again works", async () => {
  await withSite(DESKTOP, async (site) => {
    const { page, goto } = site;
    await signIn(site);
    await goto("/games/god-of-war");
    await page.getByRole("button", { name: /Buy now/ }).click();
    await page.getByText("Pay ₹1,500").waitFor();
    await page.evaluate(() => { window.__razorpayMode = "dismiss"; });
    await page.getByRole("button", { name: "Pay ₹1,500" }).click();
    await page.getByText(/Payment cancelled — nothing was charged/).waitFor();
    assert.equal((await backend.query("select count(*)::int as n from public.cart_items where user_id = $1", [customerId()]))[0].n, 1, "the cart is kept");
    assert.equal((await backend.query("select status from public.orders where user_id = $1 and total = 1500", [customerId()]))[0].status, "pending_payment", "an unpaid order waits");

    await page.evaluate(() => { window.__razorpayMode = "pay"; });
    await page.getByRole("button", { name: "Pay ₹1,500" }).click();
    await page.getByRole("heading", { name: /^Order GB-/ }).waitFor();
    assert.equal((await backend.query("select count(*)::int as n from public.orders where user_id = $1 and total = 1500 and status = 'paid'", [customerId()]))[0].n, 1);

    // Trying again reuses the unpaid order rather than leaving an abandoned duplicate beside the paid one.
    assert.equal((await backend.query("select count(*)::int as n from public.orders where user_id = $1 and total = 1500", [customerId()]))[0].n, 1);
    await goto("/account/orders");
    assert.doesNotMatch(await text(page), /Waiting for payment/);
  });
});

suite("rentals: the plan and price come from the database, and the cart says which plan", async () => {
  await withSite(DESKTOP, async (site) => {
    const { page, goto } = site;
    await signIn(site);
    await goto("/games/gta-5");
    await page.getByRole("tab", { name: "Rent" }).click();
    await page.getByRole("radio", { name: /3 days/ }).click();
    await page.getByRole("button", { name: /Rent · 3 days · ₹300/ }).click();
    await page.getByRole("heading", { name: "Your cart" }).waitFor();
    const body = await text(page);
    assert.match(body, /Rent · 3 days/);
    assert.match(body, /Pay ₹300/);
    await page.getByRole("button", { name: `Remove ${GTA.title}` }).click();
    await page.getByRole("heading", { name: "Your cart is empty" }).waitFor();
  });
});

suite("a game that stops being available blocks payment until it is removed", async () => {
  await withSite(DESKTOP, async (site) => {
    const { page, goto } = site;
    await signIn(site);
    await goto("/games/god-of-war");
    await page.getByRole("button", { name: "Add to cart" }).click();
    await page.getByRole("link", { name: /In your cart/ }).waitFor();
    await backend.query("update public.listings set is_available = false where game_id = 'god-of-war'");
    try {
      await goto("/cart");
      await page.getByText(/is no longer available/).waitFor();
      assert.equal(await page.getByRole("button", { name: "Remove unavailable games to continue" }).isDisabled(), true);
      await goto("/games/god-of-war");
      assert.ok(await page.getByRole("complementary", { name: "Buy or rent" }).getByText("Currently unavailable").isVisible());
      assert.equal(await page.getByRole("button", { name: "Add to cart" }).count(), 0, "no way to add an unavailable game");
      await goto("/cart");
      await page.getByRole("button", { name: `Remove ${GOW.title}` }).click();
      await page.getByRole("heading", { name: "Your cart is empty" }).waitFor();
    } finally {
      await backend.query("update public.listings set is_available = true where game_id = 'god-of-war'");
    }
  });
});

suite("a 100% coupon places the order without any payment window", async () => {
  await withSite(DESKTOP, async (site) => {
    const { page, goto } = site;
    await signIn(site);
    await goto("/games/gta-5");
    await page.getByRole("button", { name: /Buy now/ }).click();
    await page.getByLabel("Coupon code").fill("free");
    await page.getByRole("button", { name: "Apply" }).click();
    await page.getByRole("button", { name: "Place order" }).click();
    await page.getByRole("heading", { name: /^Order GB-/ }).waitFor();
    assert.equal(await page.evaluate(() => window.__razorpayOptions ?? null), null, "no payment window for a free order");
    assert.match(await text(page), /Paid/);
    assert.equal((await one("select payment_source from public.orders where id = $1", [path(page).split("/").pop()])).payment_source, "free");
  });
});

suite("checkout needs a WhatsApp number to deliver to, and says so", async () => {
  const id = backend.accounts.get("nophone@example.test").id;
  await backend.query("insert into public.cart_items (user_id, game_id, kind) values ($1, 'gta-5', 'buy') on conflict do nothing", [id]);
  await withSite(DESKTOP, async (site) => {
    const { page, goto } = site;
    await fillLogin(site, "nophone@example.test");
    await page.getByText("Step 1 of 3").waitFor();
    await goto("/cart");
    await page.getByText(/Add your WhatsApp number so we can deliver your game/).waitFor();
    assert.equal(await page.getByRole("button", { name: /^Pay/ }).isDisabled(), true);
  });
});

suite("orders belong to their customer: another account can't open them", async () => {
  await withSite(DESKTOP, async (site) => {
    const { page, goto } = site;
    await signIn(site, "other@example.test");
    await goto(`/account/orders/${firstOrder}`);
    await page.getByText("We couldn’t find that order.").waitFor();
    await goto("/account/orders");
    await page.getByText("You haven’t ordered anything yet.").waitFor();
  });
});

suite("launch offer: buy one get one free shows in the banner, the cart and the order; the customer pays the rest", async () => {
  await switchOrderingOn();
  const today = new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 10);
  const offer = { launch_offer_enabled: "true", launch_offer_title: "Launch week: buy one, get one free", launch_offer_starts: today, launch_offer_days: "7", launch_offer_max_free: "1" };
  for (const [key, value] of Object.entries(offer)) {
    await backend.query("insert into public.site_settings (key, value) values ($1, to_jsonb($2::text)) on conflict (key) do update set value = excluded.value", [key, value]);
  }
  try {
    await withSite(DESKTOP, async (site) => {
      const { page, goto, errors } = site;
      await signIn(site);
      await backend.query("delete from public.cart_items where user_id = $1", [customerId()]);
      await goto("/games/gta-5");
      await page.getByRole("button", { name: /Buy now/ }).click();
      await page.getByRole("heading", { name: "Your cart" }).waitFor();
      await goto("/games/god-of-war");
      await page.getByRole("button", { name: "Add to cart" }).click();
      await page.getByRole("link", { name: /In your cart/ }).waitFor();
      await page.getByRole("link", { name: "Cart, 2 games" }).click();

      // GTA 5 (1,000) is the cheaper game, so it is the free one: 2,500 less 1,000.
      await page.getByText("Pay ₹1,500").waitFor();
      let body = await text(page);
      assert.match(body, /Launch week: buy one, get one free — until/, "the banner shows the offer");
      assert.match(body, /Free with the offer/);
      assert.match(body, /− ₹1,000/);

      await page.getByRole("button", { name: "Pay ₹1,500" }).click();
      await page.getByRole("heading", { name: /^Order GB-/ }).waitFor();
      body = await text(page);
      assert.match(body, /Launch week: buy one, get one free\s+− ₹1,000/, "the order shows the offer as its own line");
      assert.equal(await page.evaluate(() => window.__razorpayOptions.amount), 150000, "Razorpay is asked for the price after the free game");
      const order = await one("select promo_title, promo_discount, discount, total from public.orders where id = $1", [path(page).split("/").pop()]);
      assert.deepEqual([order.promo_title, order.promo_discount, order.discount, order.total], ["Launch week: buy one, get one free", 1000, 1000, 1500]);
      assert.equal((await one("select free_with_offer from public.order_items where order_id = $1 and game_id = 'gta-5'", [path(page).split("/").pop()])).free_with_offer, true);
      assert.deepEqual(errors, []);
    });
  } finally {
    await backend.query("delete from public.site_settings where key like 'launch_offer_%'");
    await backend.query("delete from public.cart_items where user_id = $1", [customerId()]);
  }
});

for (const size of [SMALL_PHONE, PHONE]) {
  suite(`shopping screens follow the mobile rules at ${size.viewport.width}px: no sideways scroll, comfortable taps, readable text`, async () => {
    await withSite(size, async (site) => {
      const { page, goto } = site;
      await signIn(site);
      await backend.query("insert into public.cart_items (user_id, game_id, kind) values ($1, 'gta-5', 'buy') on conflict do nothing", [customerId()]);
      await backend.query("insert into public.wishlist_items (user_id, game_id) values ($1, 'god-of-war') on conflict do nothing", [customerId()]);
      await page.evaluate(() => { window.__razorpayMode = "dismiss"; });
      for (const route of ["/games/gta-5", "/cart", "/account", "/account/orders", `/account/orders/${firstOrder}`, "/account/wishlist"]) {
        await goto(route);
        await page.waitForFunction(() => !document.querySelector("[aria-busy=true]"));
        const problems = await mobileProblems(page);
        assert.deepEqual(problems, [], `${route}: ${problems.join(" | ")}`);
      }
    });
  });
}

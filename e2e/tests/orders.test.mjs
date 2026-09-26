// Fulfilment, in a real browser: a customer pays, the owner delivers the login from the admin panel, the
// customer reads it (and no one else can), then refunds, rentals, sales recorded by hand, cancelling, and
// coupons. The real payment and delivery functions run against the real database rules and a fake
// Razorpay. Needs the private supabase/ folder next to e2e/ (skipped without it). Tests build on each other.
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { chromium } from "playwright";
import { DESKTOP, PHONE, SMALL_PHONE, VARIANTS, build, catalog, fillLogin, mobileProblems } from "../lib/site.mjs";
import { backendAvailable, startBackend } from "../lib/mock-backend.mjs";
import { scenarios } from "../lib/scenarios.mjs";

const suite = backendAvailable ? test : test.skip;
const GTA = catalog.find((g) => g.id === "gta-5");
const GOW = catalog.find((g) => g.id === "god-of-war");

const context = {};
const { withSite, signedIn, asOwner, one, customerId, text, orderIdOf, customerPays } = scenarios(context);
let backend;
before(async () => {
  if (!backendAvailable) return;
  context.dist = build("orders", VARIANTS.live);
  backend = context.backend = await startBackend();
  context.browser = await chromium.launch();
  await backend.db.exec(`
    insert into public.listings (game_id, platform, price, delivery_eta_minutes, credential_type) values
      ('gta-5', '${GTA.platforms[0]}', 1000, 45, 'id_password'),
      ('god-of-war', '${GOW.platforms[0]}', 1500, 60, 'qr_code');
    insert into public.rental_plans (label, days, price, sort_order) values ('3 days', 3, 300, 1);
    insert into public.site_settings (key, value) values ('payments_enabled', to_jsonb('true'::text));
  `);
});
after(() => context.browser?.close());
let first; // the order created and delivered in the first test

suite("the owner delivers a paid order; the customer reads the login — encrypted at rest, private to them", async () => {
  first = await customerPays("gta-5");
  await asOwner(DESKTOP, async ({ page, goto }) => {
    await goto("/admin/orders");
    await page.getByRole("heading", { name: "Orders" }).waitFor();
    await page.getByRole("button", { name: "To deliver · 1" }).waitFor();
    await page.getByRole("link", { name: /GB-\d{4}-\d{6}/ }).click();
    await page.getByRole("heading", { name: /^Order GB-/ }).waitFor();
    assert.equal(orderIdOf(page), first);
    const body = await text(page);
    assert.match(body, /Asha Rao/);
    assert.match(body, /\+919876543210/);
    assert.match(body, /paid through Razorpay/);

    const form = page.getByRole("form", { name: `Deliver ${GTA.title}` });
    await form.getByRole("button", { name: "Deliver" }).click();
    await form.getByText("Enter both the login and the password.").waitFor();
    await form.getByLabel("Login (email or username)").fill("gamer@example.test");
    await form.getByLabel("Password").fill("S3cret-pass");
    await form.getByLabel("Note for the customer").fill("Don't change the password.");
    await form.getByRole("button", { name: "Deliver" }).click();
    await page.getByRole("button", { name: "Show the details we sent (this is logged)" }).waitFor();
    await page.getByText("Delivered", { exact: true }).first().waitFor();
  });

  const stored = await one("select encrypted_payload, note, delivered_by from public.order_deliveries");
  assert.ok(!stored.encrypted_payload.includes("S3cret") && !stored.encrypted_payload.includes("gamer@example"), "the login is not stored in plain text");
  assert.equal((await one("select status from public.orders where id = $1", [first])).status, "delivered");
  assert.ok(backend.mailbox.some((m) => m.type === "email" && /delivered/i.test(m.subject)), "the customer was emailed that it is ready");
  assert.ok(backend.mailbox.every((m) => m.type !== "email" || !/S3cret/.test(m.html)), "no email carries the password");

  await withSite(DESKTOP, async ({ page, goto }) => {
    await fillLogin({ page, goto }, "customer@example.test");
    await signedIn(page);
    await goto(`/account/orders/${first}`);
    await page.getByText("Everything has been delivered.").waitFor();
    assert.doesNotMatch(await text(page), /S3cret/, "nothing is shown until they ask");
    await page.getByRole("button", { name: "Show my login details" }).click();
    await page.getByText("S3cret-pass").waitFor();
    const body = await text(page);
    assert.match(body, /gamer@example\.test/);
    assert.match(body, /Don't change the password\./);
  });
});

suite("only the order's owner (or the admin, on the record) can read the details", async () => {
  const item = (await one("select id from public.order_items where order_id = $1", [first])).id;
  await withSite(DESKTOP, async (site) => {
    const { page, goto } = site;
    await fillLogin(site, "other@example.test");
    await signedIn(page);
    const outcome = await page.evaluate(async (itemId) => {
      const key = Object.keys(localStorage).find((k) => k.endsWith("-auth-token"));
      const token = JSON.parse(localStorage.getItem(key)).access_token;
      const response = await fetch("https://mock.supabase.test/functions/v1/get-delivery", { method: "POST", headers: { apikey: "anon-test-key", authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify({ order_item_id: itemId }) });
      return { status: response.status, body: await response.text() };
    }, item);
    assert.equal(outcome.status, 404, "someone else's order looks like it doesn't exist");
    assert.doesNotMatch(outcome.body, /S3cret/);
    void goto;
  });
  await asOwner(DESKTOP, async ({ page, goto }) => {
    await goto(`/admin/orders/${first}`);
    await page.getByRole("button", { name: "Show the details we sent (this is logged)" }).click();
    await page.getByText("S3cret-pass").waitFor();
  });
  assert.equal((await one("select count(*)::int as n from public.audit_log where action = 'ADMIN_READ'")).n, 1, "the admin's read is on the record");
});

suite("a refund goes through Razorpay, the order shows it, and the details stop being readable", async () => {
  await asOwner(DESKTOP, async ({ page, goto }) => {
    await goto(`/admin/orders/${first}`);
    await page.getByRole("button", { name: "Refund…" }).click();
    await page.getByRole("button", { name: /Yes, refund ₹1,000 via Razorpay/ }).click();
    await page.getByText("Refunded through Razorpay.").waitFor();
    await page.getByText("Refunded", { exact: true }).first().waitFor();
  });
  assert.ok(backend.razorpay.calls.some((c) => /\/refund$/.test(c.path)), "Razorpay was asked to refund");
  assert.equal((await one("select status from public.orders where id = $1", [first])).status, "refunded");
  await withSite(DESKTOP, async ({ page, goto }) => {
    await fillLogin({ page, goto }, "customer@example.test");
    await signedIn(page);
    await goto(`/account/orders/${first}`);
    await page.getByText("This order was refunded.").waitFor();
    assert.equal(await page.getByRole("button", { name: "Show my login details" }).count(), 0, "a refunded order no longer shows the login");
  });
});

suite("a sale made on WhatsApp is recorded against the customer's account, then delivered like any order", async () => {
  await asOwner(DESKTOP, async ({ page, goto }) => {
    await goto("/admin/orders");
    await page.getByRole("button", { name: "Record a sale" }).click();
    const form = page.getByRole("form", { name: "Record a sale" });
    await form.getByRole("button", { name: "Record sale" }).click();
    await form.getByText("Choose the customer.").waitFor();
    await form.getByLabel("Find the customer").fill("Asha");
    await form.getByLabel("Customer", { exact: true }).selectOption({ label: "Asha Rao · +919876543210" });
    await form.getByLabel("Game", { exact: true }).selectOption("god-of-war");
    await form.getByLabel("Price paid (₹)").fill("1200");
    await form.getByLabel("Customer receives").selectOption("qr_code");
    await form.getByLabel("Note").fill("Paid by UPI, ref 12345");
    await form.getByRole("button", { name: "Record sale" }).click();
    await page.getByRole("heading", { name: /^Order GB-/ }).waitFor();
    assert.match(await text(page), /recorded by hand/);

    const manual = orderIdOf(page);
    const order = await one("select status, payment_source, total, receipt_no from public.orders where id = $1", [manual]);
    assert.deepEqual([order.status, order.payment_source, order.total], ["paid", "manual", 1200]);
    assert.match(order.receipt_no, /^GB-/);
    assert.equal((await one("select count(*)::int as n from public.audit_log where action = 'MANUAL_ORDER'")).n, 1);

    const delivery = page.getByRole("form", { name: `Deliver ${GOW.title}` });
    await delivery.getByLabel("QR code text or link").fill("https://example.test/qr/abc");
    await delivery.getByRole("button", { name: "Deliver" }).click();
    await page.getByRole("button", { name: "Show the details we sent (this is logged)" }).waitFor();

    // A manual order is refunded by hand, with a reminder that the money moves outside the site.
    await page.getByRole("button", { name: "Refund…" }).click();
    await page.getByText(/return the money yourself first/).waitFor();
    await page.getByRole("button", { name: "Yes, mark as refunded" }).click();
    await page.getByText("Marked as refunded.").waitFor();
  });
});

suite("orders can be cancelled while unpaid, and moved between paid and being prepared", async () => {
  const unpaid = await customerPays("god-of-war", { dismiss: true });
  const paid = await customerPays("gta-5");
  await asOwner(DESKTOP, async ({ page, goto }) => {
    await goto(`/admin/orders/${unpaid}`);
    await page.getByText("Waiting for payment", { exact: true }).first().waitFor();
    await page.getByRole("button", { name: "Cancel this order…" }).click();
    await page.getByRole("button", { name: "Yes, cancel it" }).click();
    await page.getByText("Order cancelled.").waitFor();
    assert.equal((await one("select status from public.orders where id = $1", [unpaid])).status, "cancelled");

    await goto(`/admin/orders/${paid}`);
    await page.getByRole("button", { name: "Mark as being prepared" }).click();
    await page.getByText("Marked as being prepared.").waitFor();
    assert.equal((await one("select status from public.orders where id = $1", [paid])).status, "in_progress");
    await page.getByRole("button", { name: "Move back to paid" }).click();
    await page.getByText("Moved back to paid.").waitFor();
    assert.equal((await one("select status from public.orders where id = $1", [paid])).status, "paid");

    await goto("/admin/orders");
    await page.getByRole("button", { name: "Cancelled or refunded · 3" }).waitFor();
    await page.getByLabel("Search orders").fill(GOW.title.slice(0, 8));
    await page.getByRole("button", { name: /^All ·/ }).click();
    assert.ok(await page.getByRole("link", { name: /GB-|#/ }).first().isVisible());
  });
});

suite("a rental: the window is shown, and once the owner marks it returned the customer can no longer open the details", async () => {
  const rental = await customerPays("gta-5", { rentPlan: "3 days" });
  await asOwner(DESKTOP, async ({ page, goto }) => {
    await goto(`/admin/orders/${rental}`);
    const form = page.getByRole("form", { name: `Deliver ${GTA.title}` });
    await form.getByLabel("Login (email or username)").fill("renter@example.test");
    await form.getByLabel("Password").fill("Rent-pass-1");
    await form.getByRole("button", { name: "Deliver" }).click();
    await page.getByRole("button", { name: "Show the details we sent (this is logged)" }).waitFor();
    assert.match(await text(page), /→/, "the rental window is shown");
    await page.getByRole("button", { name: "Mark rental returned" }).click();
    await page.getByText("Returned", { exact: true }).waitFor();
  });
  assert.ok((await one("select rental_returned_at from public.order_items where order_id = $1", [rental])).rental_returned_at);
  await withSite(DESKTOP, async ({ page, goto }) => {
    await fillLogin({ page, goto }, "customer@example.test");
    await signedIn(page);
    await goto(`/account/orders/${rental}`);
    await page.getByText("Returned", { exact: true }).waitFor();
    assert.equal(await page.getByRole("button", { name: "Show my login details" }).count(), 0);
  });
});

suite("coupons: added with checks, applied in the cart by the database, switched off, deleted", async () => {
  await asOwner(DESKTOP, async ({ page, goto }) => {
    await goto("/admin/coupons");
    await page.getByRole("heading", { name: "0 coupons" }).waitFor();
    const add = page.getByRole("form", { name: "Add a coupon" });
    await add.getByRole("button", { name: "Add coupon" }).click();
    await add.getByText(/The code must be 3–32 letters/).waitFor();
    await add.getByLabel("Code").fill("welcome15");
    await add.getByLabel("Percent (1–100)").fill("150");
    await add.getByRole("button", { name: "Add coupon" }).click();
    await add.getByText("Enter a percentage from 1 to 100.").waitFor();
    await add.getByLabel("Percent (1–100)").fill("15");
    await add.getByLabel("Minimum spend (₹)").fill("500");
    await add.getByRole("button", { name: "Add coupon" }).click();
    await page.getByRole("heading", { name: "1 coupon" }).waitFor();
    await page.getByText(/15% off · min ₹500 · used 0×/).waitFor();
  });

  await withSite(DESKTOP, async (site) => {
    const { page, goto } = site;
    await fillLogin(site, "customer@example.test");
    await signedIn(page);
    await goto("/games/gta-5");
    await page.getByRole("button", { name: /Buy now/ }).click();
    await page.getByLabel("Coupon code").fill("welcome15");
    await page.getByRole("button", { name: "Apply" }).click();
    await page.getByText(/Code WELCOME15 applied — you save ₹150/).waitFor();
    await page.getByText("Pay ₹850").waitFor();
  });

  await asOwner(DESKTOP, async ({ page, goto }) => {
    await goto("/admin/coupons");
    const coupon = page.getByRole("form", { name: "Coupon WELCOME15" });
    await coupon.getByRole("switch", { name: "Active" }).click();
    await coupon.getByRole("button", { name: "Save", exact: true }).click();
    await page.getByText("Saved.").first().waitFor();
    assert.equal((await one("select is_active from public.coupons where code = 'WELCOME15'")).is_active, false);
  });
  await withSite(DESKTOP, async (site) => {
    const { page, goto } = site;
    await fillLogin(site, "customer@example.test");
    await signedIn(page);
    await goto("/cart");
    await page.getByLabel("Coupon code").fill("welcome15");
    await page.getByRole("button", { name: "Apply" }).click();
    await page.getByText(/This code isn.t valid/).waitFor();
  });
  await asOwner(DESKTOP, async ({ page, goto }) => {
    await goto("/admin/coupons");
    const coupon = page.getByRole("form", { name: "Coupon WELCOME15" });
    await coupon.getByRole("button", { name: "Delete…" }).click();
    await coupon.getByRole("button", { name: "Yes, delete it" }).click();
    await page.getByRole("heading", { name: "0 coupons" }).waitFor();
  });
});

suite("the overview shows the day's numbers from the real orders and links into the queues", async () => {
  await asOwner(DESKTOP, async ({ page, goto }) => {
    await goto("/admin");
    await page.getByRole("heading", { name: "Best sellers, last 30 days" }).waitFor();
    const body = await text(page);
    assert.match(body, new RegExp(GTA.title));
    const today = await one("select count(*)::int as n from public.orders where paid_at >= now() - interval '1 day'");
    assert.match(body, new RegExp(`Orders today\\s+${today.n}\\b`), "the count matches the database");
    await page.getByRole("link", { name: String(today.n), exact: true }).first().click();
    await page.getByRole("heading", { name: "Orders" }).waitFor();
  });
});

suite("only the owner can use the order screens: a customer is turned away and the database agrees", async () => {
  await withSite(DESKTOP, async (site) => {
    const { page, goto } = site;
    await fillLogin(site, "customer@example.test");
    await signedIn(page);
    await goto("/admin/orders");
    await page.getByRole("heading", { name: "Admins only" }).waitFor();
    const attempts = await page.evaluate(async (orderId) => {
      const key = Object.keys(localStorage).find((k) => k.endsWith("-auth-token"));
      const token = JSON.parse(localStorage.getItem(key)).access_token;
      const headers = { apikey: "anon-test-key", authorization: `Bearer ${token}`, "content-type": "application/json", prefer: "return=representation" };
      const rpc = await fetch("https://mock.supabase.test/rest/v1/rpc/admin_set_order_status", { method: "POST", headers, body: JSON.stringify({ p_order: orderId, p_status: "cancelled" }) });
      const refund = await fetch("https://mock.supabase.test/functions/v1/refund-order", { method: "POST", headers, body: JSON.stringify({ order_id: orderId }) });
      const deliver = await fetch("https://mock.supabase.test/functions/v1/deliver-order", { method: "POST", headers, body: JSON.stringify({ order_item_id: orderId, credential_type: "other", payload: "x" }) });
      const coupon = await fetch("https://mock.supabase.test/rest/v1/coupons", { method: "POST", headers, body: JSON.stringify({ code: "HACK", discount_type: "flat", discount_value: 999999 }) });
      return { rpc: rpc.ok, refund: refund.ok, deliver: deliver.ok, coupon: coupon.ok };
    }, first);
    assert.deepEqual(attempts, { rpc: false, refund: false, deliver: false, coupon: false });
    assert.equal((await one("select count(*)::int as n from public.coupons where code = 'HACK'")).n, 0);
  });
});

for (const size of [SMALL_PHONE, PHONE]) {
  suite(`order screens follow the mobile rules at ${size.viewport.width}px: no sideways scroll, comfortable taps, readable text`, async () => {
    const pending = await customerPays("god-of-war");
    await asOwner(size, async ({ page, goto }) => {
      for (const route of ["/admin/orders", `/admin/orders/${pending}`, `/admin/orders/${first}`, "/admin/coupons"]) {
        await goto(route);
        await page.getByRole("navigation", { name: "Admin" }).waitFor();
        await page.waitForFunction(() => !document.querySelector("[aria-busy=true]"));
        const problems = await mobileProblems(page);
        assert.deepEqual(problems, [], `${route}: ${problems.join(" | ")}`);
      }
      await goto("/admin/orders");
      await page.getByRole("button", { name: "Record a sale" }).click();
      await page.getByRole("form", { name: "Record a sale" }).waitFor();
      const problems = await mobileProblems(page);
      assert.deepEqual(problems, [], `record a sale: ${problems.join(" | ")}`);
    });
  });
}

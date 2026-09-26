// Trust, support and community, in a real browser against a faked Supabase that enforces the real
// database rules: customer reviews, support requests with the owner's replies, game comments, the game
// request board and suggestions — and the owner's screens for each. Needs the private supabase/ folder
// next to e2e/ (skipped without it). The tests build on each other, in order.
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { chromium } from "playwright";
import { DESKTOP, PHONE, SMALL_PHONE, VARIANTS, build, catalog, mobileProblems } from "../lib/site.mjs";
import { backendAvailable, startBackend } from "../lib/mock-backend.mjs";
import { scenarios } from "../lib/scenarios.mjs";

const suite = backendAvailable ? test : test.skip;
const GTA = catalog.find((g) => g.id === "gta-5");
const GOW = catalog.find((g) => g.id === "god-of-war");
const family = catalog.find((g) => g.franchise && catalog.filter((x) => x.franchise === g.franchise).length > 1);

const context = {};
const { withSite, asCustomer, asOwner, asUser, one, customerId, text, customerPays, markDelivered } = scenarios(context);
after(() => context.browser?.close());
before(async () => {
  if (!backendAvailable) return;
  context.dist = build("community", VARIANTS.live);
  context.backend = await startBackend();
  context.browser = await chromium.launch();
  await context.backend.db.exec(`
    insert into public.listings (game_id, platform, price, delivery_eta_minutes, credential_type) values
      ('gta-5', '${GTA.platforms[0]}', 1000, 45, 'id_password'), ('god-of-war', '${GOW.platforms[0]}', 1500, 60, 'qr_code');
    insert into public.site_settings (key, value) values ('payments_enabled', to_jsonb('true'::text));
  `);
});

/** Calls a database function as the signed-in customer of the page, straight to the API. */
const rpc = (page, fn, args) =>
  page.evaluate(async ({ fn, args }) => {
    const key = Object.keys(localStorage).find((k) => k.endsWith("-auth-token"));
    const token = JSON.parse(localStorage.getItem(key)).access_token;
    const response = await fetch(`https://mock.supabase.test/rest/v1/rpc/${fn}`, { method: "POST", headers: { apikey: "anon-test-key", authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify(args) });
    return { ok: response.ok, body: await response.text() };
  }, { fn, args });

let delivered; // a delivered GTA order, for the review and support tests
let ticket; // the support request the support test opens

suite("a customer reviews a game they received; it appears on the game page under their first name", async () => {
  delivered = await customerPays("gta-5");
  const notYet = await customerPays("god-of-war");
  await markDelivered(delivered);
  const item = (await one("select id from public.order_items where order_id = $1", [delivered])).id;

  await asCustomer(DESKTOP, async ({ page, goto }) => {
    await goto(`/account/orders/${notYet}`);
    await page.getByText("Payment received.").waitFor();
    assert.equal(await page.getByRole("button", { name: "Leave a review" }).count(), 0, "nothing to review until it has been delivered");

    await goto(`/account/orders/${delivered}`);
    await page.getByRole("button", { name: "Leave a review" }).click();
    const form = page.getByRole("form", { name: "Review this game" });
    await form.getByRole("button", { name: "Post review" }).click();
    await form.getByText("Tap the stars to rate it.").waitFor();
    await form.getByRole("radio", { name: "4 stars" }).click();
    await form.getByRole("button", { name: "Post review" }).click();
    await form.getByText("Write a few words about it.").waitFor();
    await form.getByLabel("Your review").fill("Worked first time and arrived quickly.");
    await form.getByRole("button", { name: "Post review" }).click();
    await page.getByText("Your review is on the game’s page").waitFor();
    assert.equal(await page.getByRole("button", { name: "Leave a review" }).count(), 0, "one review per game they received");

    const stored = await one("select rating, verified, reviewer_name, order_item_id from public.reviews where order_item_id = $1", [item]);
    assert.deepEqual([stored.rating, stored.verified, stored.reviewer_name], [4, true, "Asha"]);
    assert.equal((await rpc(page, "submit_review", { p_item: item, p_rating: 1, p_comment: "again" })).ok, false, "the database refuses a second review of the same item");
  });

  await withSite(DESKTOP, async ({ page, goto }) => {
    await goto("/games/gta-5");
    const body = await text(page);
    assert.match(body, /Worked first time and arrived quickly\./);
    assert.match(body, /Asha/);
    assert.match(body, /4\.0/);
    assert.match(body, /1 verified review/);
  });
  await asUser("other@example.test")(DESKTOP, async ({ page }) => {
    assert.equal((await rpc(page, "submit_review", { p_item: item, p_rating: 5, p_comment: "not mine" })).ok, false, "only the customer the game was delivered to can review it");
  });
});

suite("support: a request tied to an order, the owner's replies, the outcome, closing — visible only to its owner", async () => {
  await asCustomer(DESKTOP, async ({ page, goto }) => {
    await goto(`/account/orders/${delivered}`);
    await page.getByRole("link", { name: "Something wrong with this order? Get help" }).click();
    const form = page.getByRole("form", { name: "New request" });
    await form.getByLabel("Which order?").waitFor();
    assert.notEqual(await form.getByLabel("Which order?").inputValue(), "", "the order is already chosen");
    await form.getByRole("button", { name: "Send" }).click();
    await form.getByText("Give your request a short title.").waitFor();
    await form.getByLabel("Title").fill("My login isn't working");
    await form.getByRole("button", { name: "Send" }).click();
    await form.getByText("Tell us what’s happening.").waitFor();
    await form.getByLabel("Tell us what’s happening").fill("It says the password is wrong.");
    await form.getByRole("button", { name: "Send" }).click();
    await page.getByRole("heading", { name: "My login isn't working" }).waitFor();
    ticket = new URL(page.url()).pathname.split("/").pop();
    const body = await text(page);
    assert.match(body, /It says the password is wrong\./);
    assert.match(body, /Open/);
    assert.match(body, /Order GB-/);
  });

  await asOwner(DESKTOP, async ({ page, goto }) => {
    await goto("/admin/support");
    await page.getByRole("button", { name: "Needs a reply · 1" }).waitFor();
    await page.getByRole("link", { name: /My login isn't working/ }).click();
    await page.getByText("It says the password is wrong.").waitFor();
    assert.match(await text(page), /Asha Rao/);
    await page.getByLabel("Your message").fill("Sorry about that — we're looking into it now.");
    await page.getByRole("button", { name: "Send", exact: true }).click();
    await page.getByText("Sorry about that — we're looking into it now.").waitFor();
    assert.equal((await one("select status from public.support_tickets where id = $1", [ticket])).status, "in_progress", "a reply from the owner moves it to 'we're on it'");
  });

  await asCustomer(DESKTOP, async ({ page, goto }) => {
    await goto(`/account/support/${ticket}`);
    await page.getByText("Sorry about that — we're looking into it now.").waitFor();
    assert.match(await text(page), /We’re on it/);
    await page.getByLabel("Your message").fill("Thanks!");
    await page.getByRole("button", { name: "Send", exact: true }).click();
    await page.getByText("Thanks!").waitFor();
  });

  await asOwner(DESKTOP, async ({ page, goto }) => {
    await goto(`/admin/support/${ticket}`);
    const controls = page.getByRole("form", { name: "Update this request" });
    await controls.getByLabel("Status").selectOption("resolved");
    await controls.getByLabel("What went wrong").selectOption("not_working");
    await controls.getByLabel("Outcome").selectOption("replacement");
    await controls.getByRole("button", { name: "Save" }).click();
    await page.getByText("Updated.").waitFor();
  });

  await asCustomer(DESKTOP, async ({ page, goto }) => {
    await goto(`/account/support/${ticket}`);
    await page.getByText("We’re sending a replacement.").waitFor();
    assert.match(await text(page), /Resolved/);
    await page.getByLabel("Your message").fill("Still not working, sorry.");
    await page.getByRole("button", { name: "Send", exact: true }).click();
    await page.getByText("Still not working, sorry.").waitFor();
    assert.equal((await one("select status from public.support_tickets where id = $1", [ticket])).status, "open", "a customer's reply reopens a resolved request");
  });

  await asOwner(DESKTOP, async ({ page, goto }) => {
    await goto(`/admin/support/${ticket}`);
    await page.getByRole("form", { name: "Update this request" }).getByLabel("Status").selectOption("closed");
    await page.getByRole("form", { name: "Update this request" }).getByRole("button", { name: "Save" }).click();
    await page.getByText("Updated.").waitFor();
  });

  await asCustomer(DESKTOP, async ({ page, goto }) => {
    await goto(`/account/support/${ticket}`);
    await page.getByText("This request is closed.").waitFor();
    assert.equal(await page.getByLabel("Your message").count(), 0, "no reply box on a closed request");
    assert.equal((await rpc(page, "reply_ticket", { p_ticket: ticket, p_message: "hello?" })).ok, false);
    await goto("/account/support");
    assert.match(await text(page), /My login isn't working/);
  });

  await asUser("other@example.test")(DESKTOP, async ({ page, goto }) => {
    await goto(`/account/support/${ticket}`);
    await page.getByText("We couldn’t find that request.").waitFor();
    assert.equal((await rpc(page, "reply_ticket", { p_ticket: ticket, p_message: "let me in" })).ok, false, "someone else's request is invisible to them");
    await goto("/account/support");
    await page.getByText("No requests yet.").waitFor();
  });
});

suite("comments: public to read, signed-in to post, own to delete; the owner can hide or remove any", async () => {
  await withSite(DESKTOP, async ({ page, goto }) => {
    await goto("/games/gta-5");
    await page.getByRole("heading", { name: "Comments" }).waitFor();
    await page.getByText("No comments yet.").waitFor();
    assert.match(await page.getByRole("link", { name: "Log in to comment" }).getAttribute("href"), /next=%2Fgames%2Fgta-5/);
  });

  await asCustomer(DESKTOP, async ({ page, goto }) => {
    await goto("/games/gta-5");
    const form = page.getByRole("form", { name: "Add a comment" });
    await form.getByRole("button", { name: "Post comment" }).click();
    await form.getByText("Write something first.").waitFor();
    await form.getByLabel("Add a comment").fill("Runs well on my setup.");
    await form.getByRole("button", { name: "Post comment" }).click();
    await page.getByText("Runs well on my setup.").waitFor();
    assert.match(await text(page), /Asha/);
    assert.equal((await one("select author_name from public.game_comments")).author_name, "Asha", "shown under the first name only");
  });

  await asUser("other@example.test")(DESKTOP, async ({ page, goto }) => {
    await goto("/games/gta-5");
    await page.getByText("Runs well on my setup.").waitFor();
    assert.equal(await page.getByRole("button", { name: "Delete my comment" }).count(), 0, "others can't delete it");
  });

  await asOwner(DESKTOP, async ({ page, goto }) => {
    await goto("/admin/comments");
    await page.getByText("Runs well on my setup.").waitFor();
    assert.match(await text(page), new RegExp(GTA.title));
    await page.getByRole("button", { name: "Hide", exact: true }).click();
    await page.getByText("Hidden from the store").waitFor();
  });
  await withSite(DESKTOP, async ({ page, goto }) => {
    await goto("/games/gta-5");
    await page.getByText("No comments yet.").waitFor();
  });
  await asOwner(DESKTOP, async ({ page, goto }) => {
    await goto("/admin/comments");
    await page.getByRole("button", { name: "Show again" }).click();
    await page.getByText("Hidden from the store").waitFor({ state: "detached" });
  });

  await asCustomer(DESKTOP, async ({ page, goto }) => {
    await goto("/games/gta-5");
    await page.getByRole("button", { name: "Delete my comment" }).click();
    await page.getByText("No comments yet.").waitFor();
    // Posting is rate-limited by the database; the page says so plainly.
    for (let i = 0; i < 5; i++) assert.equal((await rpc(page, "post_comment", { p_game: "gta-5", p_body: `Comment ${i}` })).ok, true);
    await goto("/games/gta-5");
    await page.getByRole("textbox", { name: "Add a comment" }).fill("One too many");
    await page.getByRole("button", { name: "Post comment" }).click();
    await page.getByText(/You’re posting quickly/).waitFor();
  });

  await asOwner(DESKTOP, async ({ page, goto }) => {
    await goto("/admin/comments");
    const first = page.locator("main").getByRole("listitem").first();
    await first.getByRole("button", { name: "Delete…" }).click();
    await first.getByRole("button", { name: "Yes, delete it" }).click();
    await page.waitForFunction(() => document.querySelectorAll("main ul > li").length === 4);
  });
  assert.equal((await one("select count(*)::int as n from public.game_comments")).n, 4, "the owner removed one of the five");
});

suite("game requests: anyone reads the board, customers ask and vote, a repeat adds a vote, the owner updates the status", async () => {
  await withSite(DESKTOP, async ({ page, goto }) => {
    await goto("/requests");
    await page.getByText("No requests yet. Be the first.").waitFor();
    await page.getByRole("link", { name: "Log in" }).first().waitFor();
  });

  await asCustomer(DESKTOP, async ({ page, goto }) => {
    await goto("/requests");
    const form = page.getByRole("form", { name: "Request a game" });
    await form.getByRole("button", { name: "Send request" }).click();
    await form.getByText("Enter the game’s name.").waitFor();
    await form.getByLabel("Game name").fill("Grand Theft");
    await form.getByText("Already in the store?").waitFor();
    assert.ok(await form.getByRole("link", { name: GTA.title }).isVisible(), "it points at the game if it's already sold here");
    await form.getByLabel("Game name").fill("Silksong Test");
    await form.getByLabel("Platform").selectOption("pc");
    await form.getByRole("button", { name: "Send request" }).click();
    await page.getByText(/Thanks! It’s on the list/).waitFor();
    await page.getByRole("button", { name: /Remove your vote for Silksong Test, 1 vote/ }).waitFor();
    assert.match(await text(page), /Requested/);
  });

  await asUser("other@example.test")(DESKTOP, async ({ page, goto }) => {
    await goto("/requests");
    await page.getByRole("button", { name: /Vote for Silksong Test, 1 vote/ }).click();
    await page.getByRole("button", { name: /Remove your vote for Silksong Test, 2 votes/ }).waitFor();
    await page.getByRole("button", { name: /Remove your vote for Silksong Test, 2 votes/ }).click();
    await page.getByRole("button", { name: /Vote for Silksong Test, 1 vote/ }).waitFor();
    // Asking for the same game again is a vote, not a duplicate.
    await page.getByLabel("Game name").fill("silksong test");
    await page.getByRole("button", { name: "Send request" }).click();
    await page.getByRole("button", { name: /Remove your vote for Silksong Test, 2 votes/ }).waitFor();
    assert.equal((await one("select count(*)::int as n from public.game_requests")).n, 1);
  });

  await asOwner(DESKTOP, async ({ page, goto }) => {
    await goto("/admin/requests");
    await page.getByText(/2 votes/).waitFor();
    const row = page.getByRole("listitem").filter({ hasText: "Silksong Test" });
    await row.getByLabel("Status").selectOption("planned");
    await page.waitForFunction(() => [...document.querySelectorAll("main select")].some((s) => s.value === "planned"));
    assert.equal((await one("select status from public.game_requests")).status, "planned");
  });
  await withSite(DESKTOP, async ({ page, goto }) => {
    await goto("/requests");
    await page.getByText("Planned", { exact: true }).waitFor();
  });
  await asOwner(DESKTOP, async ({ page, goto }) => {
    await goto("/admin/requests");
    await page.getByRole("listitem").filter({ hasText: "Silksong Test" }).getByLabel("Status").selectOption("declined");
    await page.waitForFunction(() => [...document.querySelectorAll("main select")].some((s) => s.value === "declined"));
  });
  await withSite(DESKTOP, async ({ page, goto }) => {
    await goto("/requests");
    await page.getByText("No requests yet. Be the first.").waitFor();
    await goto("/browse?q=zzzzqx");
    assert.match(await page.getByRole("link", { name: "Request a game" }).getAttribute("href"), /^\/requests\?title=zzzzqx/, "the browse page leads to the board while the store is live");
  });
});

suite("suggestions: what's been selling for visitors, and picks with a reason for a signed-in customer", async () => {
  await withSite(DESKTOP, async ({ page, goto }) => {
    await goto("/");
    await page.getByRole("heading", { name: "Popular right now" }).waitFor();
    await page.getByRole("region", { name: "Popular games" }).getByRole("heading", { name: GTA.title, exact: true }).waitFor();
  });

  await context.backend.query("insert into public.wishlist_items (user_id, game_id) values ($1, $2)", [customerId(), family.id]);
  await context.backend.query("update public.profiles set genres = array['Racing'] where id = $1", [customerId()]);
  await asCustomer(DESKTOP, async ({ page, goto }) => {
    await goto("/");
    await page.getByRole("heading", { name: "Picked for you" }).waitFor();
    const rail = page.getByRole("region", { name: "Games picked for you" });
    assert.match(await rail.innerText(), /Because you like /, "each pick says why");
    assert.equal(await rail.getByRole("heading", { name: family.title, exact: true }).count(), 0, "never the game they already saved");
  });
});

for (const size of [SMALL_PHONE, PHONE]) {
  suite(`support and community screens follow the mobile rules at ${size.viewport.width}px: no sideways scroll, comfortable taps, readable text`, async () => {
    await context.backend.query("insert into public.game_comments (game_id, user_id, author_name, body) values ('gta-5', $1, 'Asha', 'Nice game.')", [customerId()]);
    await context.backend.query("insert into public.game_requests (user_id, title, platform) values ($1, 'Another Test Game', 'ps5')", [customerId()]);
    await asCustomer(size, async ({ page, goto }) => {
      for (const route of ["/", "/games/gta-5", "/requests", "/account/support", `/account/support/${ticket}`, `/account/orders/${delivered}`, "/account"]) {
        await goto(route);
        await page.waitForFunction(() => !document.querySelector("[aria-busy=true]"));
        const problems = await mobileProblems(page);
        assert.deepEqual(problems, [], `${route}: ${problems.join(" | ")}`);
      }
      await goto("/account/support");
      await page.getByRole("button", { name: "New request" }).click();
      const problems = await mobileProblems(page);
      assert.deepEqual(problems, [], `new request form: ${problems.join(" | ")}`);
    });
    await asOwner(size, async ({ page, goto }) => {
      for (const route of ["/admin/support", `/admin/support/${ticket}`, "/admin/comments", "/admin/requests"]) {
        await goto(route);
        await page.getByRole("navigation", { name: "Admin" }).waitFor();
        await page.waitForFunction(() => !document.querySelector("[aria-busy=true]"));
        const problems = await mobileProblems(page);
        assert.deepEqual(problems, [], `${route}: ${problems.join(" | ")}`);
      }
    });
  });
}

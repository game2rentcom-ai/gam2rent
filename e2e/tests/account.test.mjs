// Accounts, in a real browser against a faked Supabase that enforces the real database rules: sign up,
// log in and out, the first-time set-up, editing details, password reset, and that protected pages stay
// protected. Needs the private supabase/ folder next to e2e/ (skipped without it). Run with: npm test
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { chromium } from "playwright";
import { PHONE, SMALL_PHONE, VARIANTS, build, fillLogin, mobileProblems, openSite } from "../lib/site.mjs";
import { backendAvailable, startBackend } from "../lib/mock-backend.mjs";

const suite = backendAvailable ? test : test.skip;

let browser;
let dist;
let backend;
before(async () => {
  if (!backendAvailable) return;
  dist = build("account", VARIANTS.live);
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
const pageText = (page) => page.evaluate(() => document.body.innerText);
const path = (page) => new URL(page.url()).pathname + new URL(page.url()).search;

const profileOf = (email) =>
  backend.query("select full_name, phone, onboarding_done, platforms, genres from public.profiles where id = $1", [backend.accounts.get(email)?.id]).then((r) => r[0]);

suite("sign up checks every field, then asks the customer to confirm their email", async () => {
  await withSite(PHONE, async ({ page, goto, errors }) => {
    await goto("/signup");
    await page.getByRole("button", { name: "Create account" }).click();
    const text = await pageText(page);
    for (const message of ["Tell us your name.", "Enter a valid email address.", "Use at least 8 characters.", "Please agree to continue."]) assert.match(text, new RegExp(message));

    await page.getByLabel("Your name").fill("Neha Iyer");
    await page.getByLabel("Email").fill("neha@example.test");
    await page.getByLabel("Password", { exact: true }).fill("longenough1");
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Create account" }).click();

    await page.getByRole("heading", { name: "Check your inbox" }).waitFor();
    assert.match(await pageText(page), /neha@example\.test/);
    assert.deepEqual(await profileOf("neha@example.test"), { full_name: "Neha Iyer", phone: null, onboarding_done: false, platforms: [], genres: [] }, "the account and its profile exist");
    assert.deepEqual(errors, []);

    // Until the email is confirmed, logging in says so instead of a vague failure.
    await fillLogin({ page, goto }, "neha@example.test", "longenough1");
    await page.getByText(/Please confirm your email first/).waitFor();
  });
});

suite("log in: a wrong password gets a plain message; a right one lands on the account and survives a reload; log out works", async () => {
  await withSite(PHONE, async ({ page, goto }) => {
    await fillLogin({ page, goto }, "customer@example.test", "not-the-password");
    await page.getByText(/That email and password don’t match/).waitFor();
    assert.equal(path(page), "/login");

    await page.getByLabel("Password", { exact: true }).fill("password123");
    await page.getByRole("button", { name: "Log in" }).click();
    await page.getByRole("heading", { name: "My account" }).waitFor();
    assert.equal(path(page), "/account");
    assert.match(await pageText(page), /customer@example\.test/);
    assert.equal(await page.getByLabel("Your name").inputValue(), "Asha Rao");
    assert.equal(await page.getByLabel("WhatsApp number").inputValue(), "+91 98765 43210");
    assert.equal(await page.getByRole("link", { name: "Open the admin panel" }).count(), 0, "a customer never sees the admin link");

    await goto("/account");
    await page.getByRole("heading", { name: "My account" }).waitFor();
    assert.equal(path(page), "/account", "the login is remembered after a reload");

    await page.getByRole("button", { name: "Log out" }).click();
    await page.getByRole("link", { name: "Log in" }).first().waitFor();
    await goto("/account");
    assert.equal(path(page), "/login?next=%2Faccount", "logged out, the account page asks to log in");
  });
});

suite("protected pages send visitors to log in and bring them back afterwards", async () => {
  await withSite(PHONE, async (site) => {
    const { page, goto } = site;
    await goto("/account");
    assert.equal(path(page), "/login?next=%2Faccount");
    await page.getByLabel("Email").fill("customer@example.test");
    await page.getByLabel("Password", { exact: true }).fill("password123");
    await page.getByRole("button", { name: "Log in" }).click();
    await page.getByRole("heading", { name: "My account" }).waitFor();
    assert.equal(path(page), "/account", "back where they were going");
  });
  await withSite(PHONE, async ({ page, goto }) => {
    await goto("/login?next=https://evil.example/steal");
    await page.getByLabel("Email").fill("customer@example.test");
    await page.getByLabel("Password", { exact: true }).fill("password123");
    await page.getByRole("button", { name: "Log in" }).click();
    await page.getByRole("heading", { name: "My account" }).waitFor();
    assert.equal(new URL(page.url()).hostname, "gamebuy.test", "a login link can never send someone to another site");
  });
});

suite("first login walks through set-up: details are validated and saved, the taste steps can be skipped", async () => {
  await withSite(PHONE, async ({ page, goto }) => {
    await fillLogin({ page, goto }, "nophone@example.test");
    await page.getByText("Step 1 of 3").waitFor();
    assert.equal(path(page), "/welcome", "someone who hasn't set up lands on set-up, not the account page");

    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByText("Tell us your name.").waitFor();
    await page.getByLabel("Your name").fill("Rohan Mehta");
    await page.getByLabel("WhatsApp number").fill("12345");
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByText(/Enter a WhatsApp number we can reach you on/).waitFor();

    await page.getByLabel("WhatsApp number").fill("98765 12345");
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByText("Step 2 of 3").waitFor();
    assert.deepEqual(await profileOf("nophone@example.test"), { full_name: "Rohan Mehta", phone: "919876512345", onboarding_done: false, platforms: [], genres: [] }, "a 10-digit number is stored with the India code");

    await page.getByRole("button", { name: "PS5", exact: true }).click();
    await page.getByRole("button", { name: "PC", exact: true }).click();
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByText("Step 3 of 3").waitFor();
    await page.getByRole("button", { name: "Open-World" }).click();
    await page.getByRole("button", { name: "Finish" }).click();
    await page.waitForURL((u) => u.pathname === "/");

    const profile = await profileOf("nophone@example.test");
    assert.equal(profile.onboarding_done, true);
    assert.deepEqual([...profile.platforms].sort(), ["pc", "ps5"]);
    assert.deepEqual(profile.genres, ["Open-World"]);

    await page.getByRole("link", { name: "Account" }).first().click();
    await page.getByRole("heading", { name: "My account" }).waitFor();
    assert.equal(await page.getByLabel("WhatsApp number").inputValue(), "+91 98765 12345", "the saved details are shown back");
    assert.equal(await page.getByRole("button", { name: "PS5", exact: true }).getAttribute("aria-pressed"), "true");
  });

  // Someone who skips everything is still marked done, and is not sent back to set-up.
  await backend.query("update public.profiles set onboarding_done = false where id = $1", [backend.IDS.OTHER]);
  await withSite(PHONE, async ({ page, goto }) => {
    await fillLogin({ page, goto }, "other@example.test");
    await page.getByText("Step 1 of 3").waitFor();
    await page.getByRole("button", { name: "Skip for now" }).click();
    await page.waitForURL((u) => u.pathname === "/");
    assert.equal((await profileOf("other@example.test")).onboarding_done, true);
  });
});

suite("account page: details save, a bad number is refused, and a customer can't touch anyone else's profile", async () => {
  await withSite(PHONE, async ({ page, goto }) => {
    await fillLogin({ page, goto }, "customer@example.test");
    await page.getByRole("heading", { name: "My account" }).waitFor();

    await page.getByLabel("WhatsApp number").fill("abc");
    await page.getByRole("button", { name: "Save changes" }).click();
    await page.getByText(/doesn’t look like a valid WhatsApp number/).waitFor();

    await page.getByLabel("Your name").fill("Asha R.");
    await page.getByLabel("WhatsApp number").fill("+44 7700 900123");
    await page.getByRole("button", { name: "RPG" }).click();
    await page.getByRole("button", { name: "Save changes" }).click();
    await page.getByText("Saved.").waitFor();
    const mine = await profileOf("customer@example.test");
    assert.equal(mine.full_name, "Asha R.");
    assert.equal(mine.phone, "447700900123", "international numbers keep their own country code");
    assert.deepEqual(mine.genres, ["RPG"]);

    // The database, not the screen, decides: writing to another customer's profile changes nothing.
    const before = await profileOf("other@example.test");
    const outcome = await page.evaluate(async () => {
      const key = Object.keys(localStorage).find((k) => k.endsWith("-auth-token"));
      const token = JSON.parse(localStorage.getItem(key)).access_token;
      const response = await fetch("https://mock.supabase.test/rest/v1/profiles?id=neq.00000000-0000-0000-0000-0000000000c1", {
        method: "PATCH",
        headers: { apikey: "anon-test-key", authorization: `Bearer ${token}`, "content-type": "application/json", prefer: "return=representation" },
        body: JSON.stringify({ full_name: "Hijacked" }),
      });
      return { ok: response.ok, rows: response.ok ? (await response.json()).length : 0 };
    });
    assert.equal(outcome.rows, 0, "no other profile was changed");
    assert.deepEqual(await profileOf("other@example.test"), before);
  });
});

suite("forgot password sends a reset request, and an expired reset link explains itself", async () => {
  await withSite(PHONE, async ({ page, goto }) => {
    await goto("/forgot");
    await page.getByLabel("Email").fill("customer@example.test");
    await page.getByRole("button", { name: "Send reset link" }).click();
    await page.getByText(/a reset link is on its way/).waitFor();
    assert.ok(backend.mailbox.some((m) => m.type === "recovery" && m.email === "customer@example.test"), "the request reached the auth server");

    await goto("/reset");
    await page.getByRole("heading", { name: "This link has expired" }).waitFor();
    assert.ok(await page.getByRole("link", { name: "Send me a new link" }).isVisible());
  });
});

suite("changing the password: the new one works and the old one doesn't", async () => {
  await withSite(PHONE, async ({ page, goto }) => {
    await fillLogin({ page, goto }, "other@example.test");
    await page.getByRole("heading", { name: "My account" }).waitFor();
    await goto("/reset"); // a signed-in visitor (as after the emailed link) can choose a new password
    await page.getByLabel("New password").fill("short");
    await page.getByRole("button", { name: "Save password" }).click();
    await page.getByText("Use at least 8 characters.").first().waitFor();
    await page.getByLabel("New password").fill("a-new-password");
    await page.getByLabel("Repeat the password").fill("something-else");
    await page.getByRole("button", { name: "Save password" }).click();
    await page.getByText("The two passwords don’t match.").waitFor();
    await page.getByLabel("Repeat the password").fill("a-new-password");
    await page.getByRole("button", { name: "Save password" }).click();
    await page.getByRole("heading", { name: "Password updated" }).waitFor();
  });
  await withSite(PHONE, async ({ page, goto }) => {
    await fillLogin({ page, goto }, "other@example.test", "password123");
    await page.getByText(/That email and password don’t match/).waitFor();
    await page.getByLabel("Password", { exact: true }).fill("a-new-password");
    await page.getByRole("button", { name: "Log in" }).click();
    await page.waitForURL((u) => u.pathname === "/account");
  });
});

suite("account screens follow the mobile rules: no sideways scroll, comfortable taps, readable text", async () => {
  for (const size of [SMALL_PHONE, PHONE]) {
    await withSite(size, async (site) => {
      const { page, goto } = site;
      for (const route of ["/login", "/signup", "/forgot"]) {
        await goto(route);
        const problems = await mobileProblems(page);
        assert.deepEqual(problems, [], `${route} at ${size.viewport.width}px: ${problems.join(" | ")}`);
      }
      await fillLogin(site, "customer@example.test");
      await page.getByRole("heading", { name: "My account" }).waitFor();
      const problems = await mobileProblems(page);
      assert.deepEqual(problems, [], `/account at ${size.viewport.width}px: ${problems.join(" | ")}`);
    });
  }
});

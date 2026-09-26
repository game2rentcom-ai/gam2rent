// Building blocks the shop, fulfilment and community suites share: opening the site as a customer or as
// the owner, having a customer pay for a game, and small database look-ups. The suite fills in
// `context` (browser, built site, fake backend) in its `before` hook; everything reads it lazily.
import { DESKTOP, fillLogin, openSite } from "./site.mjs";
import { installFakeRazorpay } from "./mock-backend.mjs";

export function scenarios(context) {
  const withSite = async (options, run) => {
    const site = await openSite(context.browser, { dist: context.dist, backend: context.backend, ...options });
    await installFakeRazorpay(site.page, context.backend);
    try {
      await run(site);
    } finally {
      await site.close();
    }
  };

  /** "Account" is exact: on the login page "Create an account" would also match, before anyone is signed in. */
  const signedIn = (page) => page.getByRole("link", { name: "Account", exact: true }).first().waitFor();

  const asUser = (email) => async (options, run) =>
    withSite(options, async (site) => {
      await fillLogin(site, email);
      await signedIn(site.page);
      await run(site);
    });
  const asCustomer = asUser("customer@example.test");
  const asOwner = asUser("admin@example.test");

  const one = async (sql, params) => (await context.backend.query(sql, params))[0];
  const customerId = () => context.backend.accounts.get("customer@example.test").id;
  const text = (page) => page.evaluate(() => document.body.innerText);
  const orderIdOf = (page) => new URL(page.url()).pathname.split("/").pop();

  /** A customer buys (or rents) a game through the site and pays; returns the order id. */
  async function customerPays(gameId = "gta-5", { rentPlan, dismiss = false } = {}) {
    let orderId;
    await asCustomer(DESKTOP, async ({ page, goto }) => {
      await goto(`/games/${gameId}`);
      if (rentPlan) {
        await page.getByRole("tab", { name: "Rent" }).click();
        await page.getByRole("radio", { name: new RegExp(rentPlan) }).click();
        await page.getByRole("button", { name: new RegExp(`Rent · ${rentPlan}`) }).click();
      } else {
        await page.getByRole("button", { name: /Buy now/ }).click();
      }
      if (dismiss) await page.evaluate(() => { window.__razorpayMode = "dismiss"; });
      await page.getByRole("button", { name: /^Pay/ }).click();
      if (dismiss) {
        await page.getByText(/Payment cancelled/).waitFor();
        orderId = (await one("select id from public.orders where user_id = $1 order by created_at desc limit 1", [customerId()])).id;
      } else {
        await page.getByRole("heading", { name: /^Order GB-/ }).waitFor();
        orderId = orderIdOf(page);
      }
    });
    return orderId;
  }

  /** Marks an order's items delivered directly in the database (the delivery screen has its own tests). */
  const markDelivered = async (orderId) => {
    await context.backend.query("update public.order_items set delivery_status = 'delivered', delivered_at = now() where order_id = $1", [orderId]);
    await context.backend.query("update public.orders set status = 'delivered', delivered_at = now() where id = $1", [orderId]);
  };

  return { withSite, signedIn, asCustomer, asOwner, asUser, one, customerId, text, orderIdOf, customerPays, markDelivered };
}

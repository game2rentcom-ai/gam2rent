// A fake Supabase for the browser tests: login, the data API (PostgREST's query language, enough for
// what the app uses), file storage and the server functions — all backed by the REAL database rules
// running in memory (supabase/sql via PGlite), so row-level security, constraints and the money
// functions behave exactly as they will in production. The app talks to it through the same
// supabase-js it uses live; only the network is faked.
//
// Needs the private supabase/ folder next to e2e/; without it the suites that use this skip.
import { existsSync } from "node:fs";
import { createHmac, randomUUID } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const TESTS = join(HERE, "..", "..", "supabase", "tests");
const FUNCTIONS = join(HERE, "..", "..", "supabase", "functions");
export const backendAvailable = existsSync(join(TESTS, "harness.mjs"));

const IDENT = /^[a-z_][a-z0-9_]*$/;
const b64url = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "*",
  "access-control-allow-methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS,HEAD",
  "access-control-expose-headers": "content-range,x-supabase-api-version",
};

export const KEY_SECRET = "mock_key_secret";
export const WEBHOOK_SECRET = "mock_webhook_secret";
export const FUNCTION_ENV = {
  RAZORPAY_KEY_ID: "rzp_test_mock", RAZORPAY_KEY_SECRET: KEY_SECRET, RAZORPAY_WEBHOOK_SECRET: WEBHOOK_SECRET,
  CREDENTIAL_KEY: Buffer.alloc(32, 7).toString("base64"), ADMIN_EMAIL: "owner@example.test", SITE_URL: "http://gamebuy.test",
};

const rls = (e) => (e.code === "42501" ? "Forbidden" : e.message);

/**
 * Stands in for Razorpay's payment window in a page. `new Razorpay(options).open()` pays the order at
 * once and hands the browser what the real window would (the signature is computed with the key
 * secret); set `window.__razorpayMode = "dismiss"` to have the customer close the window instead.
 * `window.__razorpayOptions` keeps what the page asked for, so a test can check it never sent a price.
 */
let paymentSequence = 0; // payment ids are unique across every page of the run, as they are at Razorpay
export async function installFakeRazorpay(page, backend) {
  await page.exposeFunction("__payOrder", (options) => {
    const id = `pay_test_${++paymentSequence}`;
    backend.razorpay.state.payments[id] = { id, order_id: options.order_id, status: "captured", amount: options.amount };
    const signature = createHmac("sha256", KEY_SECRET).update(`${options.order_id}|${id}`).digest("hex");
    return { razorpay_order_id: options.order_id, razorpay_payment_id: id, razorpay_signature: signature };
  });
  await page.addInitScript(() => {
    window.Razorpay = class {
      constructor(options) {
        this.options = options;
        const { handler, modal, ...plain } = options;
        window.__razorpayOptions = plain;
      }
      open() {
        if (window.__razorpayMode === "dismiss") return void setTimeout(() => this.options.modal.ondismiss(), 30);
        window.__payOrder(this.options).then((response) => this.options.handler(response));
      }
    };
  });
}

export async function startBackend({ confirmEmails = false } = {}) {
  const harness = await import(pathToFileURL(join(TESTS, "harness.mjs")).href);
  const pg = await import(pathToFileURL(join(TESTS, "pg-deps.mjs")).href);
  const { db, as, IDS, setup } = harness;
  await setup();

  // Login accounts. The harness created the users' database rows; this gives them passwords.
  const accounts = new Map([
    ["customer@example.test", { id: IDS.CUSTOMER, password: "password123", confirmed: true }],
    ["other@example.test", { id: IDS.OTHER, password: "password123", confirmed: true }],
    ["nophone@example.test", { id: IDS.NOPHONE, password: "password123", confirmed: true }],
    ["admin@example.test", { id: IDS.ADMIN, password: "password123", confirmed: true }],
  ]);
  // The customers and the admin have used the site before, so they are past first-time set-up; "nophone" hasn't.
  await db.exec(`update public.profiles set onboarding_done = true where id in ('${IDS.CUSTOMER}', '${IDS.OTHER}', '${IDS.ADMIN}')`);
  const refreshTokens = new Map();
  const files = new Map();
  const razorpay = pg.fakeRazorpay();
  const mailbox = []; // password-reset requests and the like, for assertions
  let queue = Promise.resolve();
  const serial = (fn) => { const next = queue.then(fn, fn); queue = next.catch(() => {}); return next; };

  const identityOf = (headers) => {
    const token = (headers.authorization ?? "").replace(/^Bearer /i, "");
    try {
      const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString());
      if (payload.role === "authenticated" && [...accounts.values()].some((a) => a.id === payload.sub) && payload.exp * 1000 > Date.now()) return { role: "authenticated", uid: payload.sub, email: payload.email };
    } catch { /* not one of ours: anonymous */ }
    return { role: "anon", uid: null };
  };

  const userObject = (email, account) => ({
    id: account.id, aud: "authenticated", role: "authenticated", email, email_confirmed_at: account.confirmed ? new Date().toISOString() : null,
    phone: "", app_metadata: { provider: "email" }, user_metadata: {}, identities: [{ id: account.id }], created_at: new Date().toISOString(),
  });
  const session = (email, account) => {
    const expires_in = 3600;
    const exp = Math.floor(Date.now() / 1000) + expires_in;
    const payload = { sub: account.id, role: "authenticated", aud: "authenticated", email, exp };
    const access_token = `${b64url({ alg: "HS256", typ: "JWT" })}.${b64url(payload)}.${createHmac("sha256", "mock").update(String(exp)).digest("base64url")}`;
    const refresh_token = randomUUID();
    refreshTokens.set(refresh_token, email);
    return { access_token, token_type: "bearer", expires_in, expires_at: exp, refresh_token, user: userObject(email, account) };
  };

  // ---------------------------------------------------------------- auth
  async function auth(path, method, body, identity) {
    const json = (status, data) => ({ status, data });
    if (path === "/token") {
      const grant = body.__grant;
      if (grant === "refresh_token") {
        const email = refreshTokens.get(body.refresh_token);
        return email ? json(200, session(email, accounts.get(email))) : json(400, { code: 400, error_code: "refresh_token_not_found", msg: "Invalid Refresh Token" });
      }
      const account = accounts.get(String(body.email ?? "").toLowerCase());
      if (!account || account.password !== body.password) return json(400, { code: 400, error_code: "invalid_credentials", msg: "Invalid login credentials" });
      if (!account.confirmed) return json(400, { code: 400, error_code: "email_not_confirmed", msg: "Email not confirmed" });
      return json(200, session(String(body.email).toLowerCase(), account));
    }
    if (path === "/signup") {
      const email = String(body.email ?? "").toLowerCase();
      if (!/^\S+@\S+\.\S+$/.test(email)) return json(400, { code: 400, error_code: "validation_failed", msg: "Unable to validate email address: invalid format" });
      if (String(body.password ?? "").length < 6) return json(422, { code: 422, error_code: "weak_password", msg: "Password should be at least 6 characters." });
      if (accounts.has(email)) return json(200, { ...userObject(email, accounts.get(email)), identities: [] }); // Supabase does not reveal that the account exists
      const id = randomUUID();
      await serial(() => db.query("insert into auth.users (id, email) values ($1, $2)", [id, email]));
      const fullName = body.data?.full_name;
      if (fullName) await serial(() => db.query("update public.profiles set full_name = $2 where id = $1", [id, fullName]));
      const account = { id, password: body.password, confirmed: confirmEmails };
      accounts.set(email, account);
      return json(200, confirmEmails ? session(email, account) : userObject(email, account));
    }
    if (path === "/logout") return json(204, undefined);
    if (path === "/user" && method === "GET") {
      const entry = [...accounts.entries()].find(([, a]) => a.id === identity.uid);
      return entry ? json(200, userObject(entry[0], entry[1])) : json(401, { code: 401, error_code: "bad_jwt", msg: "invalid JWT" });
    }
    if (path === "/user" && method === "PUT") {
      const entry = [...accounts.entries()].find(([, a]) => a.id === identity.uid);
      if (!entry) return json(401, { code: 401, msg: "invalid JWT" });
      if (body.password) entry[1].password = body.password;
      return json(200, userObject(entry[0], entry[1]));
    }
    if (path === "/recover") {
      mailbox.push({ type: "recovery", email: String(body.email ?? "").toLowerCase() });
      return json(200, {});
    }
    return json(404, { code: 404, msg: `unknown auth route ${path}` });
  }

  // ---------------------------------------------------------------- data API
  const errorBody = (e, identity) => {
    const status = e.code === "42501" ? (identity.uid ? 403 : 401) : e.code === "23505" || e.code === "23503" ? 409 : e.code === "42P01" ? 404 : 400;
    return { status, data: { code: e.code ?? "PGRST000", message: String(e.message).replace(/^error: /, ""), details: e.detail ?? null, hint: null } };
  };

  // The query string carries every value as text; the database driver wants booleans and numbers as such.
  const columnTypes = {};
  async function typesOf(table) {
    // Through the queue like every other query: the database has one connection, and another request's
    // "set role" must not be in force while this runs (a restricted role sees no columns).
    columnTypes[table] ??= Object.fromEntries((await serial(() => db.query("select column_name, data_type from information_schema.columns where table_schema = 'public' and table_name = $1", [table]))).rows.map((r) => [r.column_name, r.data_type]));
    return columnTypes[table];
  }
  const NUMERIC = new Set(["smallint", "integer", "bigint", "numeric"]);

  function parseFilters(url, values, types) {
    const where = [];
    const RESERVED = new Set(["select", "order", "limit", "offset", "on_conflict", "columns"]);
    const OPS = { eq: "=", neq: "<>", gt: ">", gte: ">=", lt: "<", lte: "<=", like: "like", ilike: "ilike" };
    for (const [col, raw] of url.searchParams) {
      if (RESERVED.has(col)) continue;
      if (!IDENT.test(col)) throw Object.assign(new Error(`bad column ${col}`), { code: "PGRST100" });
      let [op, ...rest] = raw.split(".");
      let negate = false;
      if (op === "not") { negate = true; [op, ...rest] = rest; }
      const value = rest.join(".");
      const typed = (v) => (types[col] === "boolean" ? v === "true" : NUMERIC.has(types[col]) ? Number(v) : v);
      const push = (v) => { values.push(typed(v)); return `$${values.length}`; };
      let clause;
      if (op === "is") clause = `"${col}" is ${value === "null" ? "null" : value === "true" ? "true" : "false"}`;
      else if (op === "in") clause = `"${col}" in (${value.replace(/^\(|\)$/g, "").split(",").map((v) => push(v.replace(/^"|"$/g, ""))).join(", ")})`;
      else if (OPS[op]) clause = `"${col}" ${OPS[op]} ${push(op.endsWith("like") ? value.replaceAll("*", "%") : value)}`;
      else throw Object.assign(new Error(`unsupported filter ${op}`), { code: "PGRST100" });
      where.push(negate ? `not (${clause})` : clause);
    }
    return where.length ? ` where ${where.join(" and ")}` : "";
  }

  async function rest(path, method, url, headers, bodyText, identity) {
    const prefer = headers.prefer ?? "";
    const wantRows = prefer.includes("return=representation") || method === "GET";
    if (path.startsWith("/rpc/")) {
      const fn = path.slice(5);
      if (!IDENT.test(fn)) return { status: 404, data: { message: "no such function" } };
      const result = await serial(() => pg.callRpc(identity.role, identity.uid, fn, bodyText ? JSON.parse(bodyText) : {}));
      if (result.error) return errorBody({ code: result.error.code, message: result.error.message }, identity);
      return result.data === null ? { status: 204, data: undefined } : { status: 200, data: result.data };
    }
    const table = path.slice(1);
    if (!IDENT.test(table)) return { status: 404, data: { message: "no such table" } };
    const T = `public."${table}"`;
    const values = [];
    try {
      const run = (sql, params) => serial(() => as(identity.role, identity.uid, () => db.query(sql, params)));
      const types = await typesOf(table);

      if (method === "GET" || method === "HEAD") {
        const select = url.searchParams.get("select") ?? "*";
        const cols = select === "*" ? "*" : select.split(",").map((c) => { if (!IDENT.test(c.trim())) throw Object.assign(new Error(`unsupported select ${c}`), { code: "PGRST100" }); return `"${c.trim()}"`; }).join(", ");
        const where = parseFilters(url, values, types);
        const order = url.searchParams.get("order");
        const orderSql = order ? ` order by ${order.split(",").map((o) => { const [c, dir = "asc", nulls] = o.split("."); if (!IDENT.test(c)) throw Object.assign(new Error("bad order"), { code: "PGRST100" }); return `"${c}" ${dir === "desc" ? "desc" : "asc"}${nulls === "nullsfirst" ? " nulls first" : nulls === "nullslast" ? " nulls last" : ""}`; }).join(", ")}` : "";
        const limit = url.searchParams.get("limit"), offset = url.searchParams.get("offset");
        const range = headers.range?.match(/^(\d+)-(\d+)$/);
        const limitSql = range ? ` limit ${Number(range[2]) - Number(range[1]) + 1} offset ${Number(range[1])}` : `${limit ? ` limit ${Number(limit)}` : ""}${offset ? ` offset ${Number(offset)}` : ""}`;
        const { rows } = await run(`select ${cols} from ${T}${where}${orderSql}${limitSql}`, values);
        const extra = {};
        if (prefer.includes("count=exact")) {
          const total = (await run(`select count(*)::int as n from ${T}${where}`, values)).rows[0].n;
          extra["content-range"] = `${rows.length ? `${range ? range[1] : 0}-${(range ? Number(range[1]) : 0) + rows.length - 1}` : "*"}/${total}`;
        }
        if (headers.accept?.includes("vnd.pgrst.object")) {
          if (rows.length !== 1) return { status: 406, data: { code: "PGRST116", message: "JSON object requested, multiple (or no) rows returned", details: `The result contains ${rows.length} rows` } };
          return { status: 200, data: rows[0], extra };
        }
        return { status: method === "HEAD" ? 200 : 200, data: method === "HEAD" ? undefined : rows, extra };
      }

      if (method === "POST") {
        const body = JSON.parse(bodyText || "[]");
        const list = Array.isArray(body) ? body : [body];
        const cols = [...new Set(list.flatMap((r) => Object.keys(r)))];
        for (const c of cols) if (!IDENT.test(c)) throw Object.assign(new Error(`bad column ${c}`), { code: "PGRST100" });
        const colSql = cols.map((c) => `"${c}"`).join(", ");
        values.push(JSON.stringify(list));
        let conflict = "";
        const onConflict = url.searchParams.get("on_conflict");
        if (prefer.includes("resolution=merge-duplicates") || prefer.includes("resolution=ignore-duplicates")) {
          const keys = (onConflict ?? "").split(",").filter(Boolean);
          const target = keys.length ? `(${keys.map((k) => `"${k}"`).join(", ")})` : "";
          const updates = cols.filter((c) => !keys.includes(c)).map((c) => `"${c}" = excluded."${c}"`);
          conflict = prefer.includes("ignore-duplicates") || !updates.length ? ` on conflict ${target} do nothing` : ` on conflict ${target} do update set ${updates.join(", ")}`;
        }
        const { rows } = await run(`insert into ${T} (${colSql}) select ${colSql} from json_populate_recordset(null::${T}, $1::json)${conflict} returning *`, values);
        return { status: 201, data: wantRows ? rows : undefined };
      }

      if (method === "PATCH") {
        const body = JSON.parse(bodyText || "{}");
        const cols = Object.keys(body);
        for (const c of cols) if (!IDENT.test(c)) throw Object.assign(new Error(`bad column ${c}`), { code: "PGRST100" });
        values.push(JSON.stringify(body));
        const sets = cols.map((c) => `"${c}" = (select "${c}" from json_populate_record(null::${T}, $1::json))`).join(", ");
        const where = parseFilters(url, values, types);
        const { rows } = await run(`update ${T} set ${sets}${where} returning *`, values);
        return { status: wantRows ? 200 : 204, data: wantRows ? rows : undefined };
      }

      if (method === "DELETE") {
        const where = parseFilters(url, values, types);
        const { rows } = await run(`delete from ${T}${where} returning *`, values);
        return { status: wantRows ? 200 : 204, data: wantRows ? rows : undefined };
      }
    } catch (e) {
      return errorBody(e, identity);
    }
    return { status: 405, data: { message: "method not allowed" } };
  }

  // ---------------------------------------------------------------- storage
  async function storage(path, method, request, identity) {
    const publicMatch = path.match(/^\/object\/public\/([^/]+)\/(.+)$/);
    if (publicMatch) {
      const file = files.get(`${publicMatch[1]}/${decodeURIComponent(publicMatch[2])}`);
      return file ? { raw: file.body, contentType: file.contentType } : { status: 404, data: { statusCode: "404", error: "not_found", message: "Object not found" } };
    }
    const match = path.match(/^\/object\/([^/]+)\/(.+)$/);
    if (match && (method === "POST" || method === "PUT")) {
      const [, bucket, name] = match;
      const objectPath = decodeURIComponent(name);
      try {
        await serial(() => as(identity.role, identity.uid, () => db.query("insert into storage.objects (bucket_id, name, owner) values ($1, $2, $3)", [bucket, objectPath, identity.uid])));
      } catch (e) {
        return { status: e.code === "42501" ? 403 : 400, data: { statusCode: e.code === "42501" ? "403" : "400", error: rls(e), message: String(e.message).replace(/^error: /, "") } };
      }
      const buffer = request.postDataBuffer();
      const type = request.headers()["content-type"] ?? "";
      let body = buffer, contentType = type;
      const boundary = type.match(/boundary=(.+)$/)?.[1];
      if (boundary && buffer) {
        const parts = buffer.toString("latin1").split(`--${boundary}`);
        const filePart = parts.find((p) => /filename=/.test(p)) ?? parts.find((p) => /name=""/.test(p));
        if (filePart) {
          const head = filePart.indexOf("\r\n\r\n");
          const headers = filePart.slice(0, head);
          const start = buffer.toString("latin1").indexOf(filePart) + head + 4;
          body = buffer.subarray(start, start + filePart.length - head - 4 - 2);
          contentType = headers.match(/content-type: ([^\r\n]+)/i)?.[1] ?? "application/octet-stream";
        }
      }
      files.set(`${bucket}/${objectPath}`, { body, contentType });
      return { status: 200, data: { Key: `${bucket}/${objectPath}`, Id: randomUUID() } };
    }
    return { status: 404, data: { statusCode: "404", error: "not_found", message: "unknown storage route" } };
  }

  // ---------------------------------------------------------------- server functions
  const HANDLERS = { "create-payment": "createPaymentHandler", "verify-payment": "verifyPaymentHandler", "razorpay-webhook": "razorpayWebhookHandler", "deliver-order": "deliverOrderHandler", "get-delivery": "getDeliveryHandler", "refund-order": "refundOrderHandler" };
  async function functionCall(name, request, identity) {
    if (!HANDLERS[name]) return { status: 404, data: { message: "function not found" } };
    const mod = await import(pathToFileURL(join(FUNCTIONS, name, "handler.ts")).href);
    const deps = pg.pgDeps({ env: backend.functionEnv, razorpay });
    const headers = { "content-type": "application/json", ...(identity.uid ? { authorization: `Bearer test:${identity.uid}` } : {}) };
    const response = await mod[HANDLERS[name]](deps)(new Request("http://f/", { method: request.method(), headers, body: request.postData() ?? undefined }));
    deps.emails.forEach((e) => mailbox.push({ type: "email", ...e }));
    return { status: response.status, data: await response.json() };
  }

  const backend = {
    accounts, files, mailbox, razorpay, functionEnv: { ...FUNCTION_ENV }, db, as, serial, IDS, callRpc: pg.callRpc,
    /** Answers one browser request aimed at the fake Supabase host. */
    async handle(route) {
      const request = route.request();
      const url = new URL(request.url());
      const method = request.method();
      if (method === "OPTIONS") return route.fulfill({ status: 204, headers: CORS });
      const headers = request.headers();
      const identity = identityOf(headers);
      const bodyText = request.postData() ?? "";
      let out;
      try {
        if (url.pathname.startsWith("/auth/v1")) {
          const body = bodyText ? JSON.parse(bodyText) : {};
          if (url.pathname.endsWith("/token")) body.__grant = url.searchParams.get("grant_type");
          out = await auth(url.pathname.slice("/auth/v1".length), method, body, identity);
        } else if (url.pathname.startsWith("/rest/v1")) out = await rest(url.pathname.slice("/rest/v1".length), method, url, headers, bodyText, identity);
        else if (url.pathname.startsWith("/storage/v1")) out = await storage(url.pathname.slice("/storage/v1".length), method, request, identity);
        else if (url.pathname.startsWith("/functions/v1/")) out = await functionCall(url.pathname.slice("/functions/v1/".length), request, identity);
        else out = { status: 404, data: { message: "unknown route" } };
      } catch (e) {
        out = { status: 500, data: { message: String(e.message) } };
      }
      if (out.raw) return route.fulfill({ status: 200, headers: { ...CORS, "content-type": out.contentType }, body: out.raw });
      return route.fulfill({ status: out.status, headers: { ...CORS, "content-type": "application/json", ...(out.extra ?? {}) }, body: out.data === undefined ? "" : JSON.stringify(out.data) });
    },
    /** Direct database access for arranging a scenario or checking a result (as the database owner). */
    query: (sql, params) => serial(() => db.query(sql, params)).then((r) => r.rows),
  };
  return backend;
}

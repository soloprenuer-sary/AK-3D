/**
 * Account API for the storefront (Next.js route handler, runs as a Vercel function). It sits
 * between the browser and WordPress so the browser never holds the WordPress token or the key:
 *
 *   POST /api/auth/check      is this email an account, a guest-order email, or new?
 *   POST /api/auth/register   create a WooCommerce customer in WordPress, then sign in
 *   POST /api/auth/login      check the password in WordPress (JWT plugin), set a session cookie
 *   GET  /api/auth/me         the signed-in customer's details and saved addresses
 *   POST /api/auth/profile    save details and addresses
 *   POST /api/auth/password   change password
 *   GET  /api/auth/orders     the customer's orders
 *   GET  /api/auth/order?id=  one of their orders
 *   POST /api/auth/forgot, reset, logout
 *
 * Passwords are never stored here: WordPress checks and hashes them. The session token lives in an
 * httpOnly, Secure, SameSite=Strict cookie that page scripts cannot read. Calls that create accounts
 * or reset passwords carry a private shared key (AKRINITY_SHARED_SECRET) that WordPress checks; no
 * WordPress user or application password is involved.
 *
 * Environment (server only, set in Vercel, never in the repo): WP_URL, AKRINITY_SHARED_SECRET,
 * optional TURNSTILE_SECRET_KEY, optional UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN for
 * rate-limit counters shared across serverless instances, optional AUTH_STATUS=1 (setup check).
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

interface KV {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}

interface Env {
  WP_URL: string;
  AKRINITY_SHARED_SECRET?: string;
  TURNSTILE_SECRET_KEY?: string;
  /** Extra origins allowed to call this API, comma separated. */
  ALLOWED_ORIGINS?: string;
  /** Set to 1 to turn on GET /api/auth/status, a setup check that shows what is missing (no secrets). */
  AUTH_STATUS?: string;
  AUTH_KV?: KV;
}

interface Ctx {
  request: Request;
  env: Env;
  params: { action?: string | string[] };
}

/** Rate-limit counters in Upstash Redis (REST), so every serverless instance sees the same numbers. */
function upstash(url: string, token: string): KV {
  const headers = { Authorization: `Bearer ${token}` };
  return {
    async get(key) {
      const res = await fetch(`${url}/get/${encodeURIComponent(key)}`, {
        headers,
        cache: 'no-store',
      });
      const data = (await res.json().catch(() => ({}))) as { result?: string | null };
      return data.result ?? null;
    },
    async put(key, value, options) {
      const ttl = options?.expirationTtl ?? 3600;
      await fetch(`${url}/set/${encodeURIComponent(key)}/${encodeURIComponent(value)}?EX=${ttl}`, {
        headers,
        cache: 'no-store',
      });
    },
  };
}

function readEnv(): Env {
  const e = process.env;
  return {
    WP_URL: e.WP_URL ?? '',
    AKRINITY_SHARED_SECRET: e.AKRINITY_SHARED_SECRET,
    TURNSTILE_SECRET_KEY: e.TURNSTILE_SECRET_KEY,
    ALLOWED_ORIGINS: e.ALLOWED_ORIGINS,
    AUTH_STATUS: e.AUTH_STATUS,
    AUTH_KV:
      e.UPSTASH_REDIS_REST_URL && e.UPSTASH_REDIS_REST_TOKEN
        ? upstash(e.UPSTASH_REDIS_REST_URL, e.UPSTASH_REDIS_REST_TOKEN)
        : undefined,
  };
}

/** The visitor's address as Vercel reports it. */
function clientIp(request: Request): string {
  return (
    request.headers.get('x-real-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'local'
  );
}

const COOKIE = 'akr_session';
const MAX_BODY = 8192;
const MAX_SESSION_SECONDS = 7 * 24 * 3600;

/** Limits. Window is in seconds. Failures are counted per email and per IP. */
const LIMITS = {
  checkIp: { max: 30, window: 900 },
  loginIp: { max: 20, window: 900 },
  loginEmailFail: { max: 5, window: 900 },
  registerIp: { max: 5, window: 3600 },
  registerEmail: { max: 3, window: 3600 },
  forgotIp: { max: 10, window: 3600 },
  forgotEmail: { max: 3, window: 3600 },
  resetIp: { max: 10, window: 3600 },
  passwordIp: { max: 10, window: 3600 },
};

// ---------- rate limiting ----------

const memory = new Map<string, { count: number; resetAt: number }>();

async function readCount(env: Env, key: string): Promise<number> {
  if (env.AUTH_KV) return Number((await env.AUTH_KV.get(key)) ?? 0);
  const row = memory.get(key);
  if (!row || row.resetAt < Date.now()) return 0;
  return row.count;
}

async function bump(env: Env, key: string, windowSec: number): Promise<number> {
  const next = (await readCount(env, key)) + 1;
  if (env.AUTH_KV) {
    await env.AUTH_KV.put(key, String(next), { expirationTtl: Math.max(60, windowSec) });
  } else {
    const row = memory.get(key);
    memory.set(key, {
      count: next,
      resetAt: row && row.resetAt > Date.now() ? row.resetAt : Date.now() + windowSec * 1000,
    });
  }
  return next;
}

async function sha(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 32);
}

/** Counts a use of an action per visitor address. Returns a 429 reply when the limit is reached. */
async function limitIp(
  env: Env,
  request: Request,
  name: string,
  limit: { max: number; window: number },
): Promise<Response | null> {
  const key = `${name}:ip:${await sha(clientIp(request))}`;
  if ((await readCount(env, key)) >= limit.max) return tooMany(limit.window);
  await bump(env, key, limit.window);
  return null;
}

// ---------- responses ----------

function json(body: unknown, status = 200, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      ...extra,
    },
  });
}

function waitText(seconds: number): string {
  if (seconds >= 3600) return 'about an hour';
  const minutes = Math.max(1, Math.ceil(seconds / 60));
  return `about ${minutes} minute${minutes === 1 ? '' : 's'}`;
}

function tooMany(windowSec: number): Response {
  return json(
    {
      error: `Too many attempts. Please try again in ${waitText(windowSec)}.`,
      code: 'rate_limited',
    },
    429,
    { 'Retry-After': String(windowSec) },
  );
}

const unavailable = (what: string): Response =>
  json(
    {
      error: `${what} is temporarily unavailable. Please try again in a few minutes.`,
      code: 'unavailable',
    },
    503,
  );

function sessionCookie(token: string, maxAge: number): string {
  return `${COOKIE}=${token}; Path=/api/auth; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;
}

function clearCookie(): string {
  return `${COOKIE}=; Path=/api/auth; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}

function readCookie(request: Request): string {
  const header = request.headers.get('Cookie') ?? '';
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === COOKIE) return v.join('=');
  }
  return '';
}

// ---------- input ----------

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?\d{10,13}$/;

async function readJson(request: Request): Promise<Record<string, unknown> | null> {
  if (!(request.headers.get('Content-Type') ?? '').includes('application/json')) return null;
  const text = await request.text();
  if (text.length > MAX_BODY) return null;
  try {
    const data = JSON.parse(text);
    return data && typeof data === 'object' ? (data as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

const str = (v: unknown, max: number): string =>
  typeof v === 'string' ? v.trim().slice(0, max) : '';

/** Cross-site requests are refused: the Origin header must match this site. */
function sameOrigin(request: Request, env: Env): boolean {
  const origin = request.headers.get('Origin');
  if (origin === null) return false;
  if (origin === new URL(request.url).origin) return true;
  return (env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean)
    .includes(origin);
}

async function verifyTurnstile(env: Env, token: string, ip: string): Promise<boolean> {
  if (!env.TURNSTILE_SECRET_KEY) return true; // not configured (development)
  if (!token) return false;
  const body = new URLSearchParams({
    secret: env.TURNSTILE_SECRET_KEY,
    response: token,
    remoteip: ip,
  });
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body,
    });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}

// ---------- WordPress ----------

const wp = (env: Env, path: string) => `${env.WP_URL.replace(/\/$/, '')}/wp-json${path}`;
const signal = () => AbortSignal.timeout(25000);

interface WpReply {
  /** HTTP status from WordPress, or 0 when it did not answer. */
  status: number;
  data: Record<string, unknown>;
}

async function wpFetch(url: string, init: RequestInit): Promise<WpReply> {
  try {
    const res = await fetch(url, { ...init, cache: 'no-store', signal: signal() });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    return { status: res.status, data };
  } catch (e) {
    console.error('wordpress: no answer', String(e));
    return { status: 0, data: {} };
  }
}

/** A call only the storefront may make: it carries the private shared key. */
function wpService(env: Env, path: string, payload: Record<string, unknown>): Promise<WpReply> {
  return wpFetch(wp(env, '/akrinity/v1' + path), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Akrinity-Key': env.AKRINITY_SHARED_SECRET ?? '',
    },
    body: JSON.stringify(payload),
  });
}

/** A call made as the signed-in customer, with their own token. */
function wpCustomer(
  env: Env,
  path: string,
  token: string,
  method: 'GET' | 'POST',
  payload?: Record<string, unknown>,
): Promise<WpReply> {
  return wpFetch(wp(env, '/akrinity/v1' + path), {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: method === 'POST' ? JSON.stringify(payload ?? {}) : undefined,
  });
}

interface Jwt {
  token: string;
  user_display_name?: string;
  user_email?: string;
}

type LoginResult = Jwt | 'unavailable' | { lockedSeconds: number } | null;

/** Signs in through WordPress. null means the email or password is wrong. */
async function wpLogin(env: Env, email: string, password: string): Promise<LoginResult> {
  const r = await wpFetch(wp(env, '/jwt-auth/v1/token'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: email, password }),
  });
  if (r.status === 0) return 'unavailable';
  if (r.status === 200)
    return typeof r.data.token === 'string' ? (r.data as unknown as Jwt) : 'unavailable';
  const code = String(r.data.code ?? '');
  if (code.includes('too_many_retries')) {
    // WordPress's login limiter says e.g. "Please try again in 11 minutes".
    const m = /(\d+)\s*(hour|minute)/i.exec(String(r.data.message ?? ''));
    const seconds = m ? Number(m[1]) * (m[2].toLowerCase() === 'hour' ? 3600 : 60) : 900;
    return { lockedSeconds: seconds };
  }
  if (r.status >= 500 || r.status === 404) {
    console.error('login: WordPress returned', r.status, code);
    return 'unavailable';
  }
  return null;
}

function tokenSeconds(token: string): number {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    const left = Number(payload.exp) - Math.floor(Date.now() / 1000);
    return Math.max(60, Math.min(left, MAX_SESSION_SECONDS));
  } catch {
    return 3600;
  }
}

/** The short name shown in the header, e.g. "Akr Tester". */
const nameOf = (jwt: Jwt, fallback = ''): string => jwt.user_display_name ?? fallback;

// ---------- handlers ----------

const BAD_LOGIN = 'Email or password is incorrect.';

/** What kind of email is this: an account, someone who ordered as a guest, or new? */
async function handleCheck(request: Request, env: Env): Promise<Response> {
  const body = await readJson(request);
  const email = str(body?.email, 254).toLowerCase();
  if (!body || !EMAIL_RE.test(email)) {
    return json({ error: 'Enter a valid email like name@example.com.', field: 'email' }, 400);
  }
  const limited = await limitIp(env, request, 'check', LIMITS.checkIp);
  if (limited) return limited;
  const r = await wpService(env, '/account/status', { email });
  if (r.status === 0) return unavailable('Sign in');
  if (r.status !== 200 || typeof r.data.state !== 'string') {
    console.error('check: WordPress returned', r.status, String(r.data.code ?? ''));
    return unavailable('Sign in');
  }
  const state = r.data.state === 'account' || r.data.state === 'guest' ? r.data.state : 'new';
  return json({ state });
}

async function handleLogin(request: Request, env: Env): Promise<Response> {
  const body = await readJson(request);
  const email = str(body?.email, 254).toLowerCase();
  const password = str(body?.password, 128);
  if (!body || !EMAIL_RE.test(email) || !password) return json({ error: BAD_LOGIN }, 400);

  const ip = clientIp(request);
  const ipKey = `login:ip:${await sha(ip)}`;
  const mailKey = `login:fail:${await sha(email)}`;

  if ((await readCount(env, ipKey)) >= LIMITS.loginIp.max) return tooMany(LIMITS.loginIp.window);
  if ((await readCount(env, mailKey)) >= LIMITS.loginEmailFail.max)
    return tooMany(LIMITS.loginEmailFail.window);
  await bump(env, ipKey, LIMITS.loginIp.window);

  if (!(await verifyTurnstile(env, str(body.turnstileToken, 2048), ip))) {
    return json({ error: 'Bot check failed. Please try again.' }, 400);
  }

  const jwt = await wpLogin(env, email, password);
  if (jwt === 'unavailable') return unavailable('Sign in');
  if (jwt && 'lockedSeconds' in jwt) {
    return json(
      {
        error: `Too many failed sign-in attempts on this account. Try again in ${waitText(jwt.lockedSeconds)}, or reset your password.`,
        code: 'locked',
      },
      429,
      { 'Retry-After': String(jwt.lockedSeconds) },
    );
  }
  if (!jwt) {
    await bump(env, mailKey, LIMITS.loginEmailFail.window);
    await new Promise((r) => setTimeout(r, 400)); // slows guessing a little
    return json({ error: BAD_LOGIN }, 401);
  }
  return json({ user: { name: nameOf(jwt), email } }, 200, {
    'Set-Cookie': sessionCookie(jwt.token, tokenSeconds(jwt.token)),
  });
}

async function handleRegister(request: Request, env: Env): Promise<Response> {
  const body = await readJson(request);
  const name = str(body?.name, 80);
  const email = str(body?.email, 254).toLowerCase();
  const phone = str(body?.phone, 20).replace(/\s+/g, '');
  const password = str(body?.password, 128);
  const confirm = str(body?.confirm, 128);
  if (!body) {
    return json(
      { error: 'Something went wrong with the form. Reload the page and try again.' },
      400,
    );
  }
  if (!name) return json({ error: 'Enter your name.', field: 'name' }, 400);
  if (!EMAIL_RE.test(email)) {
    return json({ error: 'Enter a valid email like name@example.com.', field: 'email' }, 400);
  }
  if (phone && !PHONE_RE.test(phone)) {
    return json(
      { error: 'Enter a 10-digit mobile number, with or without +91.', field: 'phone' },
      400,
    );
  }
  if (password.length < 8) {
    return json({ error: 'Use at least 8 characters for your password.', field: 'password' }, 400);
  }
  if (password !== confirm) {
    return json({ error: 'The two passwords do not match.', field: 'confirm' }, 400);
  }
  if (body.consent !== true) {
    return json(
      { error: 'Tick the box to accept the terms and privacy policy.', field: 'consent' },
      400,
    );
  }

  const ip = clientIp(request);
  const ipKey = `reg:ip:${await sha(ip)}`;
  const mailKey = `reg:mail:${await sha(email)}`;
  if ((await readCount(env, ipKey)) >= LIMITS.registerIp.max)
    return tooMany(LIMITS.registerIp.window);
  if ((await readCount(env, mailKey)) >= LIMITS.registerEmail.max)
    return tooMany(LIMITS.registerEmail.window);
  await bump(env, ipKey, LIMITS.registerIp.window);
  await bump(env, mailKey, LIMITS.registerEmail.window);

  if (!(await verifyTurnstile(env, str(body.turnstileToken, 2048), ip))) {
    return json({ error: 'Bot check failed. Please try again.' }, 400);
  }

  const r = await wpService(env, '/register', { name, email, phone, password });
  if (r.status === 0) {
    return json(
      {
        error:
          'Sign-up is taking longer than usual. Your account may already be created: try signing in in a minute.',
        code: 'slow',
      },
      503,
    );
  }
  if (r.status === 400 && String(r.data.code) === 'exists') {
    return json(
      {
        error: 'An account with this email already exists. Please sign in instead.',
        code: 'exists',
      },
      409,
    );
  }
  if (r.status !== 201) {
    // 401 here means the shared key is missing or wrong on one side; 404 means the snippet is not installed.
    console.error('register: WordPress returned', r.status, String(r.data.code ?? ''));
    return json(
      {
        error: 'Sign-up is temporarily unavailable. Please try again in a few minutes.',
        code: 'unavailable',
        debug: env.AUTH_STATUS === '1' ? { wpStatus: r.status, wpCode: r.data.code } : undefined,
      },
      503,
    );
  }

  // The account exists: sign the new customer in straight away.
  const jwt = await wpLogin(env, email, password);
  if (jwt && typeof jwt === 'object' && 'token' in jwt) {
    return json({ created: true, user: { name: nameOf(jwt, name), email } }, 201, {
      'Set-Cookie': sessionCookie(jwt.token, tokenSeconds(jwt.token)),
    });
  }
  return json({ created: true }, 201);
}

/** The signed-in customer's token, or a reply telling the browser to sign in again. */
function sessionToken(request: Request): { token: string } | { reply: Response } {
  const token = readCookie(request);
  if (!token) return { reply: json({ error: 'Please sign in.', code: 'signed_out' }, 401) };
  return { token };
}

/** Passes a WordPress reply for a customer route on to the browser. */
function customerReply(r: WpReply, ok: (data: Record<string, unknown>) => unknown): Response {
  if (r.status === 0) return unavailable('Your account');
  if (r.status === 401 || r.status === 403) {
    return json(
      { error: 'Your session has ended. Please sign in again.', code: 'signed_out' },
      401,
      {
        'Set-Cookie': clearCookie(),
      },
    );
  }
  if (r.status === 404) return json({ error: String(r.data.error ?? 'Not found.') }, 404);
  if (r.status === 400)
    return json({ error: String(r.data.error ?? 'Please check your details.') }, 400);
  if (r.status !== 200) {
    console.error('customer route: WordPress returned', r.status);
    return unavailable('Your account');
  }
  return json(ok(r.data));
}

async function handleMe(request: Request, env: Env): Promise<Response> {
  const token = readCookie(request);
  if (!token) return json({ user: null });
  const r = await wpCustomer(env, '/me', token, 'GET');
  if (r.status === 401 || r.status === 403)
    return json({ user: null }, 200, { 'Set-Cookie': clearCookie() });
  if (r.status !== 200) return json({ user: null }, 503);
  const d = r.data;
  return json({
    user: {
      name: String(d.display_name ?? ''),
      email: String(d.email ?? ''),
      first_name: d.first_name,
      last_name: d.last_name,
      phone: d.phone,
      billing: d.billing,
      shipping: d.shipping,
    },
  });
}

const ADDRESS_FIELDS = [
  'first_name',
  'last_name',
  'company',
  'address_1',
  'address_2',
  'city',
  'state',
  'postcode',
  'country',
  'email',
  'phone',
];

function cleanAddress(value: unknown): Record<string, string> | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const out: Record<string, string> = {};
  for (const key of ADDRESS_FIELDS) {
    const v = (value as Record<string, unknown>)[key];
    if (typeof v === 'string') out[key] = v.trim().slice(0, 200);
  }
  return out;
}

async function handleProfile(request: Request, env: Env): Promise<Response> {
  const s = sessionToken(request);
  if ('reply' in s) return s.reply;
  const body = await readJson(request);
  if (!body)
    return json(
      { error: 'Something went wrong with the form. Reload the page and try again.' },
      400,
    );
  const first = str(body.first_name, 60);
  const last = str(body.last_name, 60);
  const phone = str(body.phone, 20).replace(/\s+/g, '');
  if (!first && !last) return json({ error: 'Enter your name.', field: 'first_name' }, 400);
  if (phone && !PHONE_RE.test(phone)) {
    return json(
      { error: 'Enter a 10-digit mobile number, with or without +91.', field: 'phone' },
      400,
    );
  }
  const billingEmail = cleanAddress(body.billing)?.email;
  if (billingEmail && !EMAIL_RE.test(billingEmail)) {
    return json({ error: 'Enter a valid billing email.', field: 'email' }, 400);
  }
  const r = await wpCustomer(env, '/me', s.token, 'POST', {
    first_name: first,
    last_name: last,
    phone,
    billing: cleanAddress(body.billing),
    shipping: cleanAddress(body.shipping),
  });
  return customerReply(r, () => ({ ok: true }));
}

async function handlePassword(request: Request, env: Env): Promise<Response> {
  const s = sessionToken(request);
  if ('reply' in s) return s.reply;
  const body = await readJson(request);
  const current = str(body?.current, 128);
  const password = str(body?.password, 128);
  const confirm = str(body?.confirm, 128);
  if (!body || !current)
    return json({ error: 'Enter your current password.', field: 'current' }, 400);
  if (password.length < 8)
    return json({ error: 'Use at least 8 characters.', field: 'password' }, 400);
  if (password !== confirm)
    return json({ error: 'The two passwords do not match.', field: 'confirm' }, 400);
  const limited = await limitIp(env, request, 'pw', LIMITS.passwordIp);
  if (limited) return limited;
  const r = await wpCustomer(env, '/me/password', s.token, 'POST', { current, password });
  return customerReply(r, () => ({ ok: true }));
}

async function handleOrders(request: Request, env: Env): Promise<Response> {
  const s = sessionToken(request);
  if ('reply' in s) return s.reply;
  return customerReply(await wpCustomer(env, '/orders', s.token, 'GET'), (d) => ({
    orders: d.orders ?? [],
  }));
}

async function handleOrder(request: Request, env: Env): Promise<Response> {
  const s = sessionToken(request);
  if ('reply' in s) return s.reply;
  const id = new URL(request.url).searchParams.get('id') ?? '';
  if (!/^\d{1,10}$/.test(id)) return json({ error: 'Order not found.' }, 404);
  return customerReply(await wpCustomer(env, `/orders/${id}`, s.token, 'GET'), (d) => ({
    order: d.order,
  }));
}

// ---------- business quote requests ----------

const GSTIN_RE = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

/** A bulk quote request from the business page. WordPress saves it and emails the admin and the customer. */
async function handleBusiness(request: Request, env: Env): Promise<Response> {
  const body = await readJson(request);
  if (!body) {
    return json(
      { error: 'Something went wrong with the form. Reload the page and try again.' },
      400,
    );
  }
  const company = str(body.company, 120);
  const name = str(body.name, 80);
  const phone = str(body.phone, 20).replace(/\s+/g, '');
  const email = str(body.email, 254).toLowerCase();
  const need = str(body.need, 80);
  const quantity = str(body.quantity, 12);
  const notes = str(body.notes, 1500);
  const gstin = str(body.gstin, 15).toUpperCase();
  const product = str(body.product, 100);

  if (!company) return json({ error: 'Enter your company name.', field: 'company' }, 400);
  if (gstin && !GSTIN_RE.test(gstin)) {
    return json(
      { error: 'GSTIN should be 15 characters, for example 27ABCDE1234F1Z5.', field: 'gstin' },
      400,
    );
  }
  if (!name) return json({ error: 'Enter the contact name.', field: 'name' }, 400);
  if (!PHONE_RE.test(phone)) {
    return json(
      { error: 'Enter a 10-digit mobile number, with or without +91.', field: 'phone' },
      400,
    );
  }
  if (!EMAIL_RE.test(email)) {
    return json({ error: 'Enter a valid email like name@example.com.', field: 'email' }, 400);
  }
  if (quantity && !/^\d{1,9}$/.test(quantity)) {
    return json({ error: 'Enter the quantity as a number.', field: 'quantity' }, 400);
  }

  const ip = clientIp(request);
  const limited = await limitIp(env, request, 'biz', { max: 5, window: 3600 });
  if (limited) return limited;
  if (!(await verifyTurnstile(env, str(body.turnstileToken, 2048), ip))) {
    return json({ error: 'Bot check failed. Please try again.' }, 400);
  }

  const r = await wpService(env, '/business-request', {
    company,
    gstin,
    name,
    phone,
    email,
    need,
    quantity,
    notes,
    product,
  });
  if (r.status === 0) {
    return json(
      {
        error:
          'The request is taking longer than usual. Please wait a minute, then check your email before sending it again.',
        code: 'slow',
      },
      503,
    );
  }
  if (r.status !== 201) {
    console.error('business: WordPress returned', r.status, String(r.data.code ?? ''));
    return json(
      {
        error: 'We could not send your request right now. Please try again in a few minutes.',
        code: 'unavailable',
        debug: env.AUTH_STATUS === '1' ? { wpStatus: r.status, wpCode: r.data.code } : undefined,
      },
      503,
    );
  }
  return json({ ok: true, reference: String(r.data.reference ?? '') }, 201);
}

// ---------- custom quote requests ----------

/** A custom quote request from the quote page. WordPress saves it under Quote requests and emails the studio. */
async function handleQuote(request: Request, env: Env): Promise<Response> {
  const body = await readJson(request);
  if (!body) {
    return json(
      { error: 'Something went wrong with the form. Reload the page and try again.' },
      400,
    );
  }
  const job = body.job === 'design' ? 'design' : 'print';
  const name = str(body.name, 80);
  const phone = str(body.phone, 20).replace(/\s+/g, '');
  const email = str(body.email, 254).toLowerCase();
  const material = str(body.material, 40);
  const quantity = str(body.quantity, 6);
  const company = str(body.company, 120);
  const gstin = str(body.gstin, 15).toUpperCase();
  const notes = str(body.notes, 1500);
  const fileName = str(body.fileName, 150);
  const fileSize = str(body.fileSize, 20);

  if (!name)
    return json({ error: 'Enter your name so we know who to reply to.', field: 'name' }, 400);
  if (!PHONE_RE.test(phone)) {
    return json(
      { error: 'Enter a 10-digit mobile number, with or without +91.', field: 'phone' },
      400,
    );
  }
  if (email && !EMAIL_RE.test(email)) {
    return json({ error: 'Enter a valid email like name@example.com.', field: 'email' }, 400);
  }
  if (gstin && !GSTIN_RE.test(gstin)) {
    return json(
      { error: 'GSTIN should be 15 characters, for example 27ABCDE1234F1Z5.', field: 'gstin' },
      400,
    );
  }
  if (quantity && !/^\d{1,4}$/.test(quantity)) {
    return json({ error: 'Enter the quantity as a number.', field: 'qty' }, 400);
  }

  const ip = clientIp(request);
  const limited = await limitIp(env, request, 'quote', { max: 5, window: 3600 });
  if (limited) return limited;
  if (!(await verifyTurnstile(env, str(body.turnstileToken, 2048), ip))) {
    return json({ error: 'Bot check failed. Please try again.' }, 400);
  }

  const r = await wpService(env, '/quote-request', {
    job,
    name,
    phone,
    email,
    material,
    quantity,
    company,
    gstin,
    notes,
    fileName,
    fileSize,
  });
  if (r.status === 0) {
    return json(
      {
        error:
          'The request is taking longer than usual. Please wait a minute and check your email before sending it again.',
        code: 'slow',
      },
      503,
    );
  }
  if (r.status !== 201) {
    console.error('quote: WordPress returned', r.status, String(r.data.code ?? ''));
    return json(
      {
        error: 'We could not send your request right now. Please try again in a few minutes.',
        code: 'unavailable',
        debug: env.AUTH_STATUS === '1' ? { wpStatus: r.status, wpCode: r.data.code } : undefined,
      },
      503,
    );
  }
  return json(
    {
      ok: true,
      reference: String(r.data.reference ?? ''),
      requestId: Number(r.data.id ?? 0),
      uploadToken: String(r.data.upload_token ?? ''),
      uploadExp: Number(r.data.upload_exp ?? 0),
    },
    201,
  );
}

// ---------- password reset ----------

const GENERIC_OK = { ok: true };

async function handleForgot(request: Request, env: Env): Promise<Response> {
  const body = await readJson(request);
  const email = str(body?.email, 254).toLowerCase();
  if (!body || !EMAIL_RE.test(email)) return json({ error: 'Enter a valid email.' }, 400);
  const ip = clientIp(request);
  const ipKey = `forgot:ip:${await sha(ip)}`;
  const mailKey = `forgot:mail:${await sha(email)}`;
  if ((await readCount(env, ipKey)) >= LIMITS.forgotIp.max) return tooMany(LIMITS.forgotIp.window);
  if ((await readCount(env, mailKey)) >= LIMITS.forgotEmail.max)
    return tooMany(LIMITS.forgotEmail.window);
  await bump(env, ipKey, LIMITS.forgotIp.window);
  await bump(env, mailKey, LIMITS.forgotEmail.window);
  if (!(await verifyTurnstile(env, str(body.turnstileToken, 2048), ip)))
    return json({ error: 'Bot check failed. Please try again.' }, 400);
  await wpService(env, '/password/forgot', { email });
  return json(GENERIC_OK); // same answer whether or not the email has an account
}

async function handleReset(request: Request, env: Env): Promise<Response> {
  const body = await readJson(request);
  const key = str(body?.key, 100);
  const login = str(body?.login, 100);
  const password = str(body?.password, 128);
  if (!body || !key || !login || password.length < 8)
    return json({ error: 'This reset link is invalid or has expired.' }, 400);
  const limited = await limitIp(env, request, 'reset', LIMITS.resetIp);
  if (limited) return limited;
  const r = await wpService(env, '/password/reset', { key, login, password });
  if (r.status === 0) return unavailable('Password reset');
  return r.status === 200
    ? json(GENERIC_OK)
    : json({ error: String(r.data.error ?? 'This reset link is invalid or has expired.') }, 400);
}

// ---------- setup check ----------

interface Check {
  name: string;
  ok: boolean;
  fix?: string;
}

/** GET /api/auth/status (only when AUTH_STATUS=1). Says what is wrong with the setup, never shows secrets. */
async function handleStatus(env: Env): Promise<Response> {
  const checks: Check[] = [];
  const add = (name: string, ok: boolean, fix?: string) =>
    checks.push({ name, ok, fix: ok ? undefined : fix });
  const host = new URL(env.WP_URL).host;

  /** Status code of a request that needs no login, or 0 when WordPress did not answer. */
  const probe = async (path: string, method: 'GET' | 'POST'): Promise<number> =>
    (
      await wpFetch(wp(env, path), {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: method === 'POST' ? '{}' : undefined,
      })
    ).status;

  const index = await probe('/', 'GET');
  add(
    `WordPress answers at ${host}`,
    index === 200,
    index === 0
      ? 'WordPress could not be reached. Check WP_URL and that the site is online.'
      : `WordPress answered with status ${index}. Check WP_URL and any firewall rules.`,
  );
  const jwt = await probe('/jwt-auth/v1/token', 'POST');
  add(
    'JWT login plugin is active',
    jwt !== 404 && jwt !== 0,
    'Install and activate "JWT Authentication for WP REST API".',
  );
  const jwtCfg = await wpFetch(wp(env, '/jwt-auth/v1/token'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'setup-check@example.invalid', password: 'setup-check' }),
  });
  add(
    'JWT secret key is set in wp-config.php',
    !String(jwtCfg.data.code ?? '').includes('bad_config') && jwtCfg.status !== 404,
    "Add define( 'JWT_AUTH_SECRET_KEY', '<long random string>' ); to wp-config.php.",
  );
  const route = await probe('/akrinity/v1/account/status', 'POST');
  add(
    'Account snippet is installed',
    route === 401 || route === 403,
    `Copy wordpress/mu-plugins/akrinity-headless-auth.php to wp-content/mu-plugins/ (route answered ${route}).`,
  );
  add(
    'Shared key is set in Vercel',
    Boolean(env.AKRINITY_SHARED_SECRET),
    'Set AKRINITY_SHARED_SECRET in the Vercel environment.',
  );
  if (env.AKRINITY_SHARED_SECRET) {
    const r = await wpService(env, '/account/status', { email: 'setup-check@example.invalid' });
    add(
      'Shared key matches WordPress',
      r.status === 200,
      r.status === 401 || r.status === 403
        ? 'WordPress refused the key. Make AKRINITY_SHARED_SECRET in wp-config.php exactly equal to the one in Vercel (40+ characters).'
        : `WordPress answered ${r.status} to the key test.`,
    );
  }
  const store = await probe('/wc/store/v1/products?per_page=1', 'GET');
  add(
    'WooCommerce REST API is on',
    store === 200,
    `Activate WooCommerce (store API answered ${store}).`,
  );
  add(
    'Rate-limit store (Upstash Redis) is set',
    Boolean(env.AUTH_KV),
    'Add Upstash Redis (UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN) so limits are shared across serverless instances.',
  );
  add(
    'Bot check key is set (Turnstile)',
    Boolean(env.TURNSTILE_SECRET_KEY),
    'Optional but recommended on a live site: set TURNSTILE_SECRET_KEY.',
  );
  return json({
    ok: checks.filter((c) => !/Turnstile|Upstash/.test(c.name)).every((c) => c.ok),
    checks,
  });
}

async function handle({ request, env, params }: Ctx): Promise<Response> {
  const action = Array.isArray(params.action) ? params.action[0] : params.action;
  if (!env.WP_URL) return json({ error: 'Accounts are not configured.' }, 503);

  if (request.method === 'GET') {
    if (action === 'status' && env.AUTH_STATUS === '1') return handleStatus(env);
    if (action === 'me') return handleMe(request, env);
    if (action === 'orders') return handleOrders(request, env);
    if (action === 'order') return handleOrder(request, env);
    return json({ error: 'Method not allowed.' }, 405, { Allow: 'POST' });
  }

  if (request.method !== 'POST')
    return json({ error: 'Method not allowed.' }, 405, { Allow: 'POST' });
  if (!sameOrigin(request, env)) {
    return json(
      {
        error: 'This request was blocked for your safety. Reload the page and try again.',
        code: 'blocked',
      },
      403,
    );
  }
  if (
    !env.AKRINITY_SHARED_SECRET &&
    ['check', 'register', 'forgot', 'reset', 'business', 'quote'].includes(action ?? '')
  ) {
    return json({ error: 'Accounts are not configured.', code: 'unconfigured' }, 503);
  }

  if (action === 'check') return handleCheck(request, env);
  if (action === 'login') return handleLogin(request, env);
  if (action === 'register') return handleRegister(request, env);
  if (action === 'profile') return handleProfile(request, env);
  if (action === 'password') return handlePassword(request, env);
  if (action === 'business') return handleBusiness(request, env);
  if (action === 'quote') return handleQuote(request, env);
  if (action === 'forgot') return handleForgot(request, env);
  if (action === 'reset') return handleReset(request, env);
  if (action === 'logout') return json({ ok: true }, 200, { 'Set-Cookie': clearCookie() });
  return json({ error: 'Not found.' }, 404);
}

type RouteContext = { params: Promise<{ action: string }> };

export async function GET(request: Request, ctx: RouteContext): Promise<Response> {
  return handle({ request, env: readEnv(), params: await ctx.params });
}

export async function POST(request: Request, ctx: RouteContext): Promise<Response> {
  return handle({ request, env: readEnv(), params: await ctx.params });
}

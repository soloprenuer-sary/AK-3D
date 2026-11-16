/**
 * Account API for the storefront (Cloudflare Pages Function). It sits between the browser and
 * WordPress so the browser never holds the WordPress token:
 *
 *   POST /api/auth/register  create a WooCommerce customer in WordPress, then sign in
 *   POST /api/auth/login     check the password in WordPress (JWT plugin), set a session cookie
 *   GET  /api/auth/me        who is signed in
 *   POST /api/auth/logout    clear the session cookie
 *
 * Passwords are never stored here: WordPress checks and hashes them. The session token lives in an
 * httpOnly, Secure, SameSite=Strict cookie that page scripts cannot read.
 *
 * Environment (server only, never in the repo): WP_URL, then WC_APP_USER + WC_APP_PASSWORD (local)
 * or WC_CONSUMER_KEY + WC_CONSUMER_SECRET (production, https),
 * optional TURNSTILE_SECRET_KEY, optional KV binding AUTH_KV for rate-limit counters.
 */

interface KV {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}

interface Env {
  WP_URL: string;
  /** Production (https): WooCommerce REST key of a shop-manager user. */
  WC_CONSUMER_KEY?: string;
  WC_CONSUMER_SECRET?: string;
  /** Local (http): application password of a shop-manager user. Used first when set. */
  WC_APP_USER?: string;
  WC_APP_PASSWORD?: string;
  TURNSTILE_SECRET_KEY?: string;
  /** Extra origins allowed to call this API, comma separated (local development behind a proxy). */
  ALLOWED_ORIGINS?: string;
  AUTH_KV?: KV;
}

interface Ctx {
  request: Request;
  env: Env;
  params: { action?: string | string[] };
}

const COOKIE = 'akr_session';
const MAX_BODY = 4096;
const MAX_SESSION_SECONDS = 7 * 24 * 3600;

/** Limits. Window is in seconds. Failures are counted per email and per IP. */
const LIMITS = {
  loginIp: { max: 20, window: 900 },
  loginEmailFail: { max: 5, window: 900 },
  registerIp: { max: 5, window: 3600 },
  registerEmail: { max: 3, window: 3600 },
  forgotIp: { max: 10, window: 3600 },
  forgotEmail: { max: 3, window: 3600 },
  resetIp: { max: 10, window: 3600 },
  verifyIp: { max: 20, window: 3600 },
  resendIp: { max: 10, window: 3600 },
  resendEmail: { max: 3, window: 3600 },
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
  if (!env.TURNSTILE_SECRET_KEY) return true; // not configured (local development)
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

/** Credentials for creating customers: a shop-manager application password, or a WooCommerce key (https only). */
function wcRequest(env: Env, path: string): { url: string; headers: Record<string, string> } {
  const user = env.WC_APP_USER || env.WC_CONSUMER_KEY || '';
  const pass = env.WC_APP_PASSWORD || env.WC_CONSUMER_SECRET || '';
  return { url: wp(env, path), headers: { Authorization: `Basic ${btoa(`${user}:${pass}`)}` } };
}

interface Jwt {
  token: string;
  user_display_name?: string;
  user_email?: string;
}

type LoginResult = Jwt | 'unverified' | 'unavailable' | { lockedSeconds: number } | null;

/** Signs in through WordPress. null means the email or password is wrong. */
async function wpLogin(env: Env, email: string, password: string): Promise<LoginResult> {
  try {
    const res = await fetch(wp(env, '/jwt-auth/v1/token'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: email, password }),
      signal: signal(),
    });
    const data = (await res.json().catch(() => ({}))) as Jwt & { code?: string; message?: string };
    if (res.ok) return data.token ? data : 'unavailable';
    const code = String(data.code ?? '');
    if (code.includes('email_not_verified')) return 'unverified';
    if (code.includes('too_many_retries')) {
      // WordPress's login limiter says e.g. "Please try again in 11 minutes".
      const m = /(\d+)\s*(hour|minute)/i.exec(data.message ?? '');
      const seconds = m ? Number(m[1]) * (m[2].toLowerCase() === 'hour' ? 3600 : 60) : 900;
      return { lockedSeconds: seconds };
    }
    if (res.status >= 500 || res.status === 404) {
      console.error('login: WordPress returned', res.status, code);
      return 'unavailable';
    }
    return null;
  } catch (e) {
    console.error('login: could not reach WordPress', String(e));
    return 'unavailable';
  }
}

/** Calls one of the storefront routes added to WordPress by the akrinity-headless-auth snippet. */
async function wpRoute(
  env: Env,
  path: string,
  payload: Record<string, string>,
): Promise<{ ok: boolean; error?: string }> {
  const req = wcRequest(env, '/akrinity/v1' + path);
  try {
    const res = await fetch(req.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...req.headers },
      body: JSON.stringify(payload),
      signal: signal(),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    return { ok: res.ok, error: data.error };
  } catch {
    return { ok: false, error: 'The account service is busy. Please try again shortly.' };
  }
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

// ---------- handlers ----------

const BAD_LOGIN = 'Email or password is incorrect.';

async function handleLogin(request: Request, env: Env): Promise<Response> {
  const body = await readJson(request);
  const email = str(body?.email, 254).toLowerCase();
  const password = str(body?.password, 128);
  if (!body || !EMAIL_RE.test(email) || !password) return json({ error: BAD_LOGIN }, 400);

  const ip = request.headers.get('CF-Connecting-IP') ?? 'local';
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
  if (jwt === 'unverified') {
    return json(
      {
        error: 'Please verify your email first. We sent you a link when you signed up.',
        code: 'unverified',
      },
      403,
    );
  }
  if (jwt === 'unavailable') {
    return json(
      {
        error: 'Sign in is temporarily unavailable. Please try again in a few minutes.',
        code: 'unavailable',
      },
      503,
    );
  }
  if (jwt && typeof jwt === 'object' && 'lockedSeconds' in jwt) {
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
  return json({ user: { name: jwt.user_display_name ?? '', email } }, 200, {
    'Set-Cookie': sessionCookie(jwt.token, tokenSeconds(jwt.token)),
  });
}

async function handleRegister(request: Request, env: Env): Promise<Response> {
  const body = await readJson(request);
  const name = str(body?.name, 80);
  const email = str(body?.email, 254).toLowerCase();
  const phone = str(body?.phone, 20).replace(/\s+/g, '');
  const password = str(body?.password, 128);
  if (!body)
    return json(
      { error: 'Something went wrong with the form. Reload the page and try again.' },
      400,
    );
  if (!name) return json({ error: 'Enter your name.', field: 'name' }, 400);
  if (!EMAIL_RE.test(email))
    return json({ error: 'Enter a valid email like name@example.com.', field: 'email' }, 400);
  if (phone && !/^\+?\d{10,13}$/.test(phone)) {
    return json(
      { error: 'Enter a 10-digit mobile number, with or without +91.', field: 'phone' },
      400,
    );
  }
  if (password.length < 8)
    return json({ error: 'Use at least 8 characters for your password.', field: 'password' }, 400);
  if (body.consent !== true)
    return json(
      { error: 'Tick the box to accept the terms and privacy policy.', field: 'consent' },
      400,
    );

  const ip = request.headers.get('CF-Connecting-IP') ?? 'local';
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

  const [first, ...rest] = name.split(/\s+/);
  const req = wcRequest(env, '/wc/v3/customers');
  let created = false;
  let wpStatus = 0;
  let wpCode = '';
  try {
    const res = await fetch(req.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...req.headers },
      body: JSON.stringify({
        email,
        password,
        first_name: first,
        last_name: rest.join(' '),
        billing: { first_name: first, last_name: rest.join(' '), email, phone },
      }),
      signal: signal(),
    });
    created = res.status === 201;
    wpStatus = res.status;
    if (!created)
      wpCode = String(
        (
          (await res
            .clone()
            .json()
            .catch(() => ({}))) as { code?: string }
        ).code ?? '',
      );
    if (created) {
      // WooCommerce shows the login name by default; store the real name as the display name.
      const made = (await res.json()) as { id?: number };
      if (made.id) {
        const patch = wcRequest(env, `/wp/v2/users/${made.id}`);
        await fetch(patch.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...patch.headers },
          body: JSON.stringify({ name }),
          signal: signal(),
        }).catch(() => undefined);
      }
    }
  } catch (e) {
    console.error('register: could not reach WordPress', String(e));
    return json(
      {
        error: 'Sign-up is temporarily unavailable. Please try again in a few minutes.',
        code: 'unavailable',
      },
      503,
    );
  }
  if (!created && (wpStatus === 401 || wpStatus === 403 || wpStatus >= 500 || wpStatus === 404)) {
    console.error('register: WordPress refused the service account', wpStatus, wpCode);
    return json(
      {
        error: 'Sign-up is temporarily unavailable. Please try again in a few minutes.',
        code: 'unavailable',
      },
      503,
    );
  }
  // The same message covers "email already used", so the form cannot be used to find out who has an account.
  if (!created)
    return json(
      {
        error:
          'We could not create that account. If you already have one, sign in or reset your password.',
        code: 'exists',
      },
      400,
    );

  // WordPress has emailed a verification link. The account cannot sign in until it is clicked.
  return json({ created: true, pendingVerification: true }, 201);
}

async function handleMe(request: Request, env: Env): Promise<Response> {
  const token = readCookie(request);
  if (!token) return json({ user: null });
  try {
    const res = await fetch(wp(env, '/wp/v2/users/me?context=edit'), {
      headers: { Authorization: `Bearer ${token}` },
      signal: signal(),
    });
    if (!res.ok) return json({ user: null }, 200, { 'Set-Cookie': clearCookie() });
    const u = (await res.json()) as { name?: string; email?: string };
    return json({ user: { name: u.name ?? '', email: u.email ?? '' } });
  } catch {
    return json({ user: null }, 503);
  }
}

// ---------- password reset and email verification ----------

const GENERIC_OK = { ok: true };

async function handleForgot(request: Request, env: Env): Promise<Response> {
  const body = await readJson(request);
  const email = str(body?.email, 254).toLowerCase();
  if (!body || !EMAIL_RE.test(email)) return json({ error: 'Enter a valid email.' }, 400);
  const ip = request.headers.get('CF-Connecting-IP') ?? 'local';
  const ipKey = `forgot:ip:${await sha(ip)}`;
  const mailKey = `forgot:mail:${await sha(email)}`;
  if ((await readCount(env, ipKey)) >= LIMITS.forgotIp.max) return tooMany(LIMITS.forgotIp.window);
  if ((await readCount(env, mailKey)) >= LIMITS.forgotEmail.max)
    return tooMany(LIMITS.forgotEmail.window);
  await bump(env, ipKey, LIMITS.forgotIp.window);
  await bump(env, mailKey, LIMITS.forgotEmail.window);
  if (!(await verifyTurnstile(env, str(body.turnstileToken, 2048), ip)))
    return json({ error: 'Bot check failed. Please try again.' }, 400);
  await wpRoute(env, '/password/forgot', { email });
  return json(GENERIC_OK); // same answer whether or not the email has an account
}

async function handleReset(request: Request, env: Env): Promise<Response> {
  const body = await readJson(request);
  const key = str(body?.key, 100);
  const login = str(body?.login, 100);
  const password = str(body?.password, 128);
  if (!body || !key || !login || password.length < 8)
    return json({ error: 'This reset link is invalid or has expired.' }, 400);
  const ip = request.headers.get('CF-Connecting-IP') ?? 'local';
  const ipKey = `reset:ip:${await sha(ip)}`;
  if ((await readCount(env, ipKey)) >= LIMITS.resetIp.max) return tooMany(LIMITS.resetIp.window);
  await bump(env, ipKey, LIMITS.resetIp.window);
  const r = await wpRoute(env, '/password/reset', { key, login, password });
  return r.ok
    ? json(GENERIC_OK)
    : json({ error: r.error ?? 'This reset link is invalid or has expired.' }, 400);
}

async function handleVerify(request: Request, env: Env): Promise<Response> {
  const body = await readJson(request);
  const key = str(body?.key, 100);
  const login = str(body?.login, 100);
  if (!body || !key || !login)
    return json({ error: 'This verification link is invalid or has expired.' }, 400);
  const ip = request.headers.get('CF-Connecting-IP') ?? 'local';
  const ipKey = `verify:ip:${await sha(ip)}`;
  if ((await readCount(env, ipKey)) >= LIMITS.verifyIp.max) return tooMany(LIMITS.verifyIp.window);
  await bump(env, ipKey, LIMITS.verifyIp.window);
  const r = await wpRoute(env, '/email/verify', { key, login });
  return r.ok
    ? json(GENERIC_OK)
    : json({ error: r.error ?? 'This verification link is invalid or has expired.' }, 400);
}

async function handleResend(request: Request, env: Env): Promise<Response> {
  const body = await readJson(request);
  const email = str(body?.email, 254).toLowerCase();
  if (!body || !EMAIL_RE.test(email)) return json({ error: 'Enter a valid email.' }, 400);
  const ip = request.headers.get('CF-Connecting-IP') ?? 'local';
  const ipKey = `resend:ip:${await sha(ip)}`;
  const mailKey = `resend:mail:${await sha(email)}`;
  if ((await readCount(env, ipKey)) >= LIMITS.resendIp.max) return tooMany(LIMITS.resendIp.window);
  if ((await readCount(env, mailKey)) >= LIMITS.resendEmail.max)
    return tooMany(LIMITS.resendEmail.window);
  await bump(env, ipKey, LIMITS.resendIp.window);
  await bump(env, mailKey, LIMITS.resendEmail.window);
  await wpRoute(env, '/email/resend', { email });
  return json(GENERIC_OK);
}

export const onRequest = async ({ request, env, params }: Ctx): Promise<Response> => {
  const action = Array.isArray(params.action) ? params.action[0] : params.action;
  if (!env.WP_URL) return json({ error: 'Accounts are not configured.' }, 503);

  if (action === 'me' && request.method === 'GET') return handleMe(request, env);

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

  if (action === 'login') return handleLogin(request, env);
  if (action === 'register') return handleRegister(request, env);
  if (action === 'forgot') return handleForgot(request, env);
  if (action === 'reset') return handleReset(request, env);
  if (action === 'verify') return handleVerify(request, env);
  if (action === 'resend') return handleResend(request, env);
  if (action === 'logout') return json({ ok: true }, 200, { 'Set-Cookie': clearCookie() });
  return json({ error: 'Not found.' }, 404);
};

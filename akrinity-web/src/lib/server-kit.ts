/**
 * Small helpers for the storefront's own server routes (cart and checkout): JSON replies, the
 * same-site check and visitor limits. Server only. Mirrors what /api/auth does.
 */

export interface KV {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}

export interface ServerEnv {
  WP_URL: string;
  AKRINITY_SHARED_SECRET?: string;
  ALLOWED_ORIGINS?: string;
  AUTH_STATUS?: string;
  KV?: KV;
}

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

export function readServerEnv(): ServerEnv {
  const e = process.env;
  return {
    WP_URL: (e.WP_URL ?? '').replace(/\/$/, ''),
    AKRINITY_SHARED_SECRET: e.AKRINITY_SHARED_SECRET,
    ALLOWED_ORIGINS: e.ALLOWED_ORIGINS,
    AUTH_STATUS: e.AUTH_STATUS,
    KV:
      e.UPSTASH_REDIS_REST_URL && e.UPSTASH_REDIS_REST_TOKEN
        ? upstash(e.UPSTASH_REDIS_REST_URL, e.UPSTASH_REDIS_REST_TOKEN)
        : undefined,
  };
}

export function json(body: unknown, status = 200, extra: Record<string, string | string[]> = {}) {
  const headers = new Headers({
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  for (const [k, v] of Object.entries(extra)) {
    if (Array.isArray(v)) v.forEach((x) => headers.append(k, x));
    else headers.set(k, v);
  }
  return new Response(JSON.stringify(body), { status, headers });
}

export function clientIp(request: Request): string {
  return (
    request.headers.get('x-real-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'local'
  );
}

/** Cross-site posts are refused: the Origin header must match this site. */
export function sameOrigin(request: Request, env: ServerEnv): boolean {
  const origin = request.headers.get('Origin');
  if (origin === null) return false;
  if (origin === new URL(request.url).origin) return true;
  return (env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean)
    .includes(origin);
}

const memory = new Map<string, { count: number; resetAt: number }>();

async function count(env: ServerEnv, key: string): Promise<number> {
  if (env.KV) return Number((await env.KV.get(key)) ?? 0);
  const row = memory.get(key);
  return !row || row.resetAt < Date.now() ? 0 : row.count;
}

async function bump(env: ServerEnv, key: string, windowSec: number): Promise<void> {
  const next = (await count(env, key)) + 1;
  if (env.KV) {
    await env.KV.put(key, String(next), { expirationTtl: Math.max(60, windowSec) });
    return;
  }
  const row = memory.get(key);
  memory.set(key, {
    count: next,
    resetAt: row && row.resetAt > Date.now() ? row.resetAt : Date.now() + windowSec * 1000,
  });
}

async function sha(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 32);
}

/** Counts a use per visitor address. Returns a 429 reply when the limit is reached, otherwise null. */
export async function limitIp(
  env: ServerEnv,
  request: Request,
  name: string,
  limit: { max: number; window: number },
): Promise<Response | null> {
  const key = `${name}:ip:${await sha(clientIp(request))}`;
  if ((await count(env, key)) >= limit.max) {
    const minutes = Math.max(1, Math.ceil(limit.window / 60));
    return json(
      {
        error: `Too many attempts. Please try again in about ${minutes} minute${minutes === 1 ? '' : 's'}.`,
        code: 'rate_limited',
      },
      429,
      { 'Retry-After': String(limit.window) },
    );
  }
  await bump(env, key, limit.window);
  return null;
}

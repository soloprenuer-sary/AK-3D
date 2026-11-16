/**
 * Read-only catalogue proxy (Cloudflare Pages Function). The browser calls this instead of
 * WordPress directly, so edits made in WordPress show on the site without a rebuild:
 *
 *   GET /api/catalog/products   every product from the WooCommerce Store API
 *   GET /api/catalog/posts      published articles from WPGraphQL
 *
 * Replies are cached at the edge for a minute, so visitors never hammer WordPress. Nothing here
 * needs a login: it only repeats data WordPress already publishes. Environment: WP_URL.
 */

interface Env {
  WP_URL: string;
}

interface Ctx {
  request: Request;
  env: Env;
  params: { kind?: string | string[] };
  waitUntil(promise: Promise<unknown>): void;
}

const CACHE_SECONDS = 60;

const POSTS_QUERY = `{
  posts(first: 50) {
    nodes {
      databaseId slug title excerpt content date
      categories { nodes { name } }
    }
  }
}`;

const reply = (body: string, status = 200): Response =>
  new Response(body, {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': `public, max-age=30, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=300`,
      'X-Content-Type-Options': 'nosniff',
    },
  });

const failure = (message: string, status: number): Response =>
  new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

async function products(base: string): Promise<Response> {
  const all: unknown[] = [];
  for (let page = 1; page <= 20; page++) {
    const res = await fetch(`${base}/wp-json/wc/store/v1/products?per_page=100&page=${page}`, {
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) return failure('The product service is unavailable.', 502);
    const data = (await res.json()) as unknown[];
    all.push(...data);
    if (page >= Number(res.headers.get('x-wp-totalpages') ?? 1) || data.length === 0) break;
  }
  return reply(JSON.stringify(all));
}

async function posts(base: string): Promise<Response> {
  const res = await fetch(`${base}/graphql`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: POSTS_QUERY }),
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) return failure('The article service is unavailable.', 502);
  const json = (await res.json()) as { data?: { posts?: { nodes: unknown[] } } };
  if (!json.data?.posts) return failure('The article service is unavailable.', 502);
  return reply(JSON.stringify(json.data.posts.nodes));
}

export const onRequestGet = async ({ request, env, params, waitUntil }: Ctx): Promise<Response> => {
  const kind = Array.isArray(params.kind) ? params.kind[0] : params.kind;
  if (!env.WP_URL) return failure('The catalogue is not configured.', 503);
  if (kind !== 'products' && kind !== 'posts') return failure('Not found.', 404);

  const cache = (caches as unknown as { default: Cache }).default;
  const key = new Request(new URL(request.url).origin + '/api/catalog/' + kind);
  const hit = await cache.match(key);
  if (hit) return hit;

  try {
    const base = env.WP_URL.replace(/\/$/, '');
    const res = kind === 'products' ? await products(base) : await posts(base);
    if (res.ok) waitUntil(cache.put(key, res.clone()));
    return res;
  } catch (e) {
    console.error('catalog: could not reach WordPress', String(e));
    return failure('The catalogue is temporarily unavailable.', 503);
  }
};

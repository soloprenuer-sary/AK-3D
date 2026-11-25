/**
 * Read-only catalogue proxy (Next.js route handler, runs as a Vercel function). The browser calls
 * this instead of WordPress directly, so edits made in WordPress show on the site quickly:
 *
 *   GET /api/catalog/products   every product from the WooCommerce Store API
 *   GET /api/catalog/posts      published articles from WPGraphQL
 *
 * Replies are cached for a minute (Vercel data cache and CDN), so visitors never hammer
 * WordPress. Nothing here needs a login: it only repeats data WordPress already publishes.
 * Environment: WP_URL.
 */

export const runtime = 'nodejs';

const CACHE_SECONDS = 60;

const POSTS_QUERY = `{
  posts(first: 50) {
    nodes {
      databaseId slug title excerpt content date
      categories { nodes { name } }
    }
  }
}`;

const reply = (body: string): Response =>
  new Response(body, {
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

type Raw = Record<string, unknown>;
const list = (v: unknown): Raw[] => (Array.isArray(v) ? (v as Raw[]) : []);

/**
 * Only what the search box and the product lists use: name, price, stock, rating, the first picture,
 * categories and attributes. The long description, the content fields and every extra picture size
 * stay out, which makes the reply a fraction of the size.
 */
function slim(p: Raw): Raw {
  const short = typeof p.short_description === 'string' ? p.short_description : '';
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    short_description: short,
    on_sale: p.on_sale,
    prices: p.prices,
    average_rating: p.average_rating,
    review_count: p.review_count,
    is_in_stock: p.is_in_stock,
    is_on_backorder: p.is_on_backorder,
    formatted_weight: p.formatted_weight,
    formatted_dimensions: p.formatted_dimensions,
    images: list(p.images)
      .slice(0, 1)
      .map((i) => ({ src: i.src, alt: i.alt })),
    categories: list(p.categories).map((c) => ({ id: c.id, name: c.name })),
    attributes: list(p.attributes).map((a) => ({
      name: a.name,
      terms: list(a.terms).map((t) => ({ name: t.name })),
    })),
  };
}

async function products(base: string): Promise<Response> {
  const all: unknown[] = [];
  for (let page = 1; page <= 20; page++) {
    const res = await fetch(
      `${base}/wp-json/wc/store/v1/products?per_page=100&page=${page}&_t=${Math.floor(Date.now() / 60000)}`,
      {
        next: { revalidate: CACHE_SECONDS },
        signal: AbortSignal.timeout(20000),
      },
    );
    if (!res.ok) return failure('The product service is unavailable.', 502);
    const data = (await res.json()) as unknown[];
    all.push(...data);
    if (page >= Number(res.headers.get('x-wp-totalpages') ?? 1) || data.length === 0) break;
  }
  return reply(JSON.stringify((all as Raw[]).map(slim)));
}

async function posts(base: string): Promise<Response> {
  const res = await fetch(`${base}/graphql`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: POSTS_QUERY }),
    next: { revalidate: CACHE_SECONDS },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) return failure('The article service is unavailable.', 502);
  const json = (await res.json()) as { data?: { posts?: { nodes: unknown[] } } };
  if (!json.data?.posts) return failure('The article service is unavailable.', 502);
  return reply(JSON.stringify(json.data.posts.nodes));
}

export async function GET(
  _request: Request,
  ctx: { params: Promise<{ kind: string }> },
): Promise<Response> {
  const { kind } = await ctx.params;
  const base = (process.env.WP_URL ?? '').replace(/\/$/, '');
  if (!base) return failure('The catalogue is not configured.', 503);
  if (kind !== 'products' && kind !== 'posts') return failure('Not found.', 404);
  try {
    return kind === 'products' ? await products(base) : await posts(base);
  } catch (e) {
    console.error('catalog: could not reach WordPress', String(e));
    return failure('The catalogue is temporarily unavailable.', 503);
  }
}

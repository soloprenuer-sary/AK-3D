/**
 * Connection to WordPress + WooCommerce. Products come from the WooCommerce Store API, articles
 * from WPGraphQL. They are read at build time (so the HTML is complete) and again in the browser
 * through the cached catalogue proxy (so edits in WordPress show without a rebuild).
 * There is no sample data: callers stop when WordPress cannot be reached (see catalogue.ts).
 */
import { COLOURS, SHOP_CATEGORIES, SHOP_MATERIALS, SIZE_OPTIONS } from './shop-data';
import type { ColourKey, ColourMode, Material, ProcessType, ShopProduct } from './shop-data';
import type { Block, Guide } from './guides-data';

const STORE_API = process.env.NEXT_PUBLIC_WC_STORE_API_URL ?? '';
const GRAPHQL = process.env.NEXT_PUBLIC_WP_GRAPHQL_URL ?? '';

/** WooCommerce Store API product (only the fields we use). */
export interface StoreProduct {
  id: number;
  name: string;
  slug?: string;
  short_description?: string;
  description?: string;
  on_sale?: boolean;
  prices: {
    price: string;
    regular_price?: string;
    sale_price?: string;
    currency_minor_unit: number;
  };
  is_in_stock: boolean;
  is_on_backorder?: boolean;
  images: { src: string; alt: string }[];
  categories: { id: number; name: string }[];
  attributes?: { name: string; terms: { name: string }[] }[];
}

/** Decode the HTML entities WordPress uses in names and excerpts (e.g. &amp;, &#8217;). */
function decode(s: string): string {
  return s
    .replace(/&#8217;|&rsquo;/g, '’')
    .replace(/&#8211;|&ndash;/g, '–')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&#39;/g, "'");
}

function stripTags(html: string): string {
  return decode(
    html
      .replace(/<[^>]+>/g, ' ')
      .replace(/s+/g, ' ')
      .trim(),
  );
}

function formatRupees(price: string, minorUnit: number): string {
  const value = Number(price) / 10 ** minorUnit;
  return `₹${Math.round(value).toLocaleString('en-IN')}`;
}

/** Terms of the first product attribute whose name matches, e.g. "Material". */
function terms(p: StoreProduct, pattern: RegExp): string[] {
  const attr = (p.attributes ?? []).find((a) => pattern.test(a.name));
  return attr ? attr.terms.map((t) => decode(t.name)) : [];
}

/** Turns one WooCommerce product into the shape the pages use. Pure: also used in the browser. */
export function mapStoreProduct(p: StoreProduct): ShopProduct {
  const names = p.categories.map((c) => decode(c.name));
  // Prefer a category the shop knows; otherwise the first one WooCommerce lists.
  const category = names.find((n) => SHOP_CATEGORIES.includes(n)) ?? names[0] ?? 'Home decor';

  const materials = terms(p, /^material$/i)
    .map((t) =>
      SHOP_MATERIALS.find(
        (m) =>
          m.toLowerCase().replace(/W/g, '') === t.toLowerCase().replace(/W/g, '') ||
          (t.toLowerCase() === 'pla' && m === 'PLA+'),
      ),
    )
    .filter((m, i, all): m is Material => Boolean(m) && all.indexOf(m) === i);
  const sizes = terms(p, /^size/i)
    .map((t) => SIZE_OPTIONS.find((x) => x.toLowerCase() === t.toLowerCase()))
    .filter((x): x is string => Boolean(x));
  materials.sort((a, b) => SHOP_MATERIALS.indexOf(a) - SHOP_MATERIALS.indexOf(b));
  sizes.sort((a, b) => SIZE_OPTIONS.indexOf(a) - SIZE_OPTIONS.indexOf(b));
  const processValue = terms(p, /process/i)[0];
  const process = (['FDM', 'Multi-filament FDM', 'Resin'] as ProcessType[]).find(
    (x) => x.toLowerCase() === (processValue ?? '').toLowerCase(),
  );
  const colours = terms(p, /^colou?rs?$/i)
    .map((t) => t.toLowerCase())
    .filter((t): t is ColourKey => t in COLOURS);
  const modeOrder: ColourMode[] = ['single', 'multi', 'painted'];
  const modes = terms(p, /colou?r (mode|option)/i)
    .map((t): ColourMode => (/multi/i.test(t) ? 'multi' : /paint/i.test(t) ? 'painted' : 'single'))
    .sort((a, b) => modeOrder.indexOf(a) - modeOrder.indexOf(b));

  const onSale =
    Boolean(p.on_sale) &&
    Boolean(p.prices.regular_price) &&
    p.prices.regular_price !== p.prices.price;
  return {
    id: `wc-${p.id}`,
    slug: p.slug || undefined,
    name: decode(p.name),
    category,
    sub: category,
    // Out of stock and "on backorder" both mean made to order.
    inStock: Boolean(p.is_in_stock) && !p.is_on_backorder,
    // Options not stored in WooCommerce yet fall back to these defaults.
    material: materials[0] ?? 'PLA+',
    materials: materials.length ? materials : undefined,
    sizes: sizes.length ? sizes : undefined,
    process: process ?? 'FDM',
    colours: colours.length ? colours : ['black'],
    modes: modes.length ? modes : ['single'],
    images: p.images.map((i) => i.src),
    price: formatRupees(p.prices.price, p.prices.currency_minor_unit),
    regularPrice: onSale
      ? formatRupees(p.prices.regular_price as string, p.prices.currency_minor_unit)
      : undefined,
    description: stripTags(p.short_description || p.description || '') || undefined,
  };
}

/** Every product from the Store API (all pages), or null if WordPress cannot be reached. */
export async function fetchStoreProducts(): Promise<ShopProduct[] | null> {
  if (!STORE_API) return null;
  try {
    const all: StoreProduct[] = [];
    for (let page = 1; page <= 20; page++) {
      const res = await fetch(`${STORE_API}/products?per_page=100&page=${page}`);
      if (!res.ok) return page === 1 ? null : all.map(mapStoreProduct);
      const data = (await res.json()) as StoreProduct[];
      all.push(...data);
      const pages = Number(res.headers.get('x-wp-totalpages') ?? 1);
      if (page >= pages || data.length === 0) break;
    }
    return all.map(mapStoreProduct);
  } catch {
    return null;
  }
}

export interface GqlPost {
  databaseId: number;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  categories: { nodes: { name: string }[] };
}

export const POSTS_QUERY = `{
  posts(first: 50) {
    nodes {
      databaseId slug title excerpt content date
      categories { nodes { name } }
    }
  }
}`;

function postToGuide(p: GqlPost): Guide {
  const cat = p.categories.nodes[0]?.name ?? 'Guides';
  const type: Guide['type'] = cat === 'Materials' || cat === 'Design' ? cat : 'Guides';
  const text = stripTags(p.content);
  const words = text.split(' ').length;
  const paragraphs = p.content
    .split(/<\/p>/i)
    .map((chunk) => stripTags(chunk))
    .filter((t) => t.length > 0);
  const body: Block[] = paragraphs.length
    ? paragraphs.map((t) => ({ t: 'p', text: t }))
    : [{ t: 'p', text }];
  return {
    slug: p.slug,
    title: decode(p.title),
    summary: stripTags(p.excerpt) || text.slice(0, 160),
    type,
    date: p.date.slice(0, 10),
    minutes: Math.max(2, Math.round(words / 200)),
    body,
  };
}

/** Turns GraphQL posts into articles. WordPress ships a default "Hello world!" post; it is not an article. */
export function mapPosts(nodes: GqlPost[]): Guide[] {
  return nodes.filter((n) => n.slug !== 'hello-world').map(postToGuide);
}

/** Published posts from WPGraphQL, or null if WordPress cannot be reached. */
export async function fetchPosts(): Promise<Guide[] | null> {
  if (!GRAPHQL) return null;
  try {
    const res = await fetch(GRAPHQL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: POSTS_QUERY }),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: { posts?: { nodes: GqlPost[] } } };
    const nodes = json.data?.posts?.nodes;
    if (!nodes) return null;
    return mapPosts(nodes);
  } catch {
    return null;
  }
}

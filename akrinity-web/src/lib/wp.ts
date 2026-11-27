/**
 * Connection to WordPress + WooCommerce. Products come from the WooCommerce Store API, articles
 * from WPGraphQL. They are read at build time (so the HTML is complete) and again in the browser
 * through the cached catalogue proxy (so edits in WordPress show without a rebuild).
 * There is no sample data: callers stop when WordPress cannot be reached (see catalogue.ts).
 */
import { CATEGORIES, COLOURS, SHOP_MATERIALS, SIZE_OPTIONS, inferSub, subKey } from './shop-data';
import type {
  ColourKey,
  ColourMode,
  Material,
  ProcessType,
  ShopCategory,
  ShopProduct,
  ShopVariation,
} from './shop-data';
import { articleBlocks, wordCount } from './article-content';
import type { Guide } from './guides-data';
import { buildSpecs, htmlToBlocks, parseProductContent } from './product-content';

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
  formatted_weight?: string;
  formatted_dimensions?: string;
  average_rating?: string;
  review_count?: number;
  is_in_stock: boolean;
  is_on_backorder?: boolean;
  /** "simple", "variable", "grouped" or "external". Options show only for "variable". */
  type?: string;
  variations?: { id: number; attributes: { name: string; value: string }[] }[];
  images: { src: string; alt: string }[];
  categories: { id: number; name: string }[];
  attributes?: {
    name: string;
    /** True when WooCommerce uses this attribute to make the product's variations. */
    has_variations?: boolean;
    terms: { name: string }[];
  }[];
  /** Added by the Akrinity WordPress snippet: bulk price ranges from ACF fields. */
  extensions?: {
    akrinity?: {
      bulk_tiers?: { from: number; to: number | null; price: string }[];
      cross_sell_ids?: number[];
      upsell_ids?: number[];
    };
    akrinity_content?: unknown;
    akrinity_model?: { url?: string; type?: string };
  };
}

/** Decode the HTML entities WordPress uses in names and excerpts (e.g. &amp;, &#8217;). */
function decode(s: string): string {
  const named: Record<string, string> = {
    amp: '&',
    quot: '"',
    apos: "'",
    lt: '<',
    gt: '>',
    nbsp: ' ',
    rsquo: '’',
    lsquo: '‘',
    ndash: '–',
    mdash: '—',
    hellip: '…',
  };
  return s
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n: string) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, n: string) => named[n.toLowerCase()] ?? m);
}

function stripTags(html: string): string {
  return decode(
    html
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim(),
  );
}

function formatRupees(price: string, minorUnit: number): string {
  const value = Number(price) / 10 ** minorUnit;
  // Keep paise when there are any, so ₹373.55 is not shown as ₹374.
  return `₹${value.toLocaleString('en-IN', { minimumFractionDigits: Number.isInteger(value) ? 0 : 2, maximumFractionDigits: 2 })}`;
}

/** Terms of the first product attribute whose name matches, e.g. "Material". */
function terms(p: StoreProduct, pattern: RegExp): string[] {
  const attr = (p.attributes ?? []).find((a) => pattern.test(a.name));
  return attr ? attr.terms.map((t) => decode(t.name)) : [];
}

/** Like terms(), but only for an attribute WooCommerce uses to build the product's variations. */
function variationTerms(p: StoreProduct, pattern: RegExp): string[] {
  const attr = (p.attributes ?? []).find((a) => pattern.test(a.name) && a.has_variations);
  return attr ? attr.terms.map((t) => decode(t.name)) : [];
}

function hasVariationAttr(p: StoreProduct, pattern: RegExp): boolean {
  return (p.attributes ?? []).some((a) => pattern.test(a.name) && a.has_variations);
}

const MATERIAL_ATTR = /^material$/i;
const SIZE_ATTR = /^size/i;
const COLOUR_ATTR = /^colou?rs?$/i;
const MODE_ATTR = /colou?r (mode|option)/i;
const PERSONALISE_ATTR = /personali[sz]/i;

function parseMaterials(list: string[]): Material[] {
  const found = list
    .map((t) =>
      SHOP_MATERIALS.find(
        (m) =>
          m.toLowerCase().replace(/\W/g, '') === t.toLowerCase().replace(/\W/g, '') ||
          (t.toLowerCase() === 'pla' && m === 'PLA+'),
      ),
    )
    .filter((m, i, all): m is Material => Boolean(m) && all.indexOf(m) === i);
  return found.sort((a, b) => SHOP_MATERIALS.indexOf(a) - SHOP_MATERIALS.indexOf(b));
}

function parseSizes(list: string[]): string[] {
  return list
    .map((t) => SIZE_OPTIONS.find((x) => x.toLowerCase() === t.toLowerCase()))
    .filter((x): x is string => Boolean(x))
    .sort((a, b) => SIZE_OPTIONS.indexOf(a) - SIZE_OPTIONS.indexOf(b));
}

function parseColours(list: string[]): ColourKey[] {
  return list.map((t) => t.toLowerCase()).filter((t): t is ColourKey => t in COLOURS);
}

function parseModes(list: string[]): ColourMode[] {
  const modeOrder: ColourMode[] = ['single', 'multi', 'painted'];
  return list
    .map((t): ColourMode => (/multi/i.test(t) ? 'multi' : /paint/i.test(t) ? 'painted' : 'single'))
    .sort((a, b) => modeOrder.indexOf(a) - modeOrder.indexOf(b));
}

/** Short description for the product page and cards: plain text, with stray ** removed. */
function shortText(html: string): string | undefined {
  return stripTags(html).replace(/\*+/g, '').replace(/\s+/g, ' ').trim() || undefined;
}

/** Turns one WooCommerce product into the shape the pages use. Pure: also used in the browser. */
export function mapStoreProduct(p: StoreProduct, tree: ShopCategory[] = CATEGORIES): ShopProduct {
  const names = p.categories.map((c) => decode(c.name));
  const ids = new Set(p.categories.map((c) => c.id));
  // Prefer a main category the shop knows. A product ticked only in a sub-category still lands in
  // the main category that owns it. Otherwise the first category WooCommerce lists.
  const subOf = (c: ShopCategory) =>
    c.subInfo.find(
      (s) =>
        (s.id !== undefined && ids.has(s.id)) || names.some((n) => subKey(n) === subKey(s.name)),
    );
  const known =
    tree.find((c) => (c.id !== undefined && ids.has(c.id)) || names.includes(c.name)) ??
    tree.find((c) => subOf(c));
  const category = known?.name ?? names[0] ?? tree[0]?.name ?? 'Home decor';
  // A sub-category ticked in WordPress wins; otherwise guess from the product name.
  const sub =
    (known ? subOf(known)?.name : undefined) ??
    (known ? inferSub(known, decode(p.name)) : undefined) ??
    category;

  const materials = parseMaterials(terms(p, MATERIAL_ATTR));
  const sizes = parseSizes(terms(p, SIZE_ATTR));
  const processValue = terms(p, /process/i)[0];
  const process = (['FDM', 'Multi-filament FDM', 'Resin'] as ProcessType[]).find(
    (x) => x.toLowerCase() === (processValue ?? '').toLowerCase(),
  );
  const colours = parseColours(terms(p, COLOUR_ATTR));
  const modes = parseModes(terms(p, MODE_ATTR));

  // Options on the product page come only from a variable product whose attributes are used for
  // its variations. A simple product shows none of them.
  const variable = p.type === 'variable' && (p.variations?.length ?? 0) > 0;
  const variation: ShopVariation | undefined = variable
    ? {
        modes: parseModes(variationTerms(p, MODE_ATTR)),
        colours: parseColours(variationTerms(p, COLOUR_ATTR)),
        materials: parseMaterials(variationTerms(p, MATERIAL_ATTR)),
        sizes: parseSizes(variationTerms(p, SIZE_ATTR)),
        personalise: hasVariationAttr(p, PERSONALISE_ATTR),
      }
    : undefined;

  const content = parseProductContent(p.extensions?.akrinity_content);
  const m3 = p.extensions?.akrinity_model;
  const model =
    m3?.url &&
    /^(https:\/\/|http:\/\/localhost[:/])/.test(m3.url) &&
    ['stl', 'glb', 'gltf', 'obj', '3mf'].includes(m3.type ?? '')
      ? { url: m3.url, type: m3.type as string }
      : undefined;
  const onSale =
    Boolean(p.on_sale) &&
    Boolean(p.prices.regular_price) &&
    p.prices.regular_price !== p.prices.price;
  return {
    id: `wc-${p.id}`,
    slug: p.slug || undefined,
    name: decode(p.name),
    category,
    sub,
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
    bulkTiers: (p.extensions?.akrinity?.bulk_tiers ?? [])
      .filter((t) => t && t.from >= 1 && Number(t.price) > 0)
      .sort((x, y) => x.from - y.from)
      .map((t) => ({
        from: t.from,
        to: t.to ?? null,
        // The price is in rupees; keep paise when there are any (for example ₹99.50).
        price:
          '₹' +
          Number(t.price).toLocaleString('en-IN', {
            minimumFractionDigits: Number.isInteger(Number(t.price)) ? 0 : 2,
            maximumFractionDigits: 2,
          }),
      })),
    regularPrice: onSale
      ? formatRupees(p.prices.regular_price as string, p.prices.currency_minor_unit)
      : undefined,
    // The WordPress short description as plain text.
    description: shortText(p.short_description || p.description || ''),
    variation,
    rating: Number(p.average_rating) > 0 ? Number(p.average_rating) : undefined,
    reviewCount: p.review_count && p.review_count > 0 ? p.review_count : undefined,
    content,
    longDescription: htmlToBlocks(p.description ?? ''),
    specs: buildSpecs(p.attributes, p.formatted_weight, p.formatted_dimensions),
    model,
    crossSellIds: p.extensions?.akrinity?.cross_sell_ids?.map((n) => `wc-${n}`),
    upsellIds: p.extensions?.akrinity?.upsell_ids?.map((n) => `wc-${n}`),
  };
}

/** Every product from the Store API (all pages), or null if WordPress cannot be reached. */
export async function fetchStoreProducts(
  tree: ShopCategory[] = CATEGORIES,
): Promise<ShopProduct[] | null> {
  if (!STORE_API) return null;
  try {
    const all: StoreProduct[] = [];
    for (let page = 1; page <= 20; page++) {
      // _t changes every minute: the host caches some REST addresses, and a new address skips a stale copy.
      const res = await fetch(
        `${STORE_API}/products?per_page=100&page=${page}&_t=${Math.floor(Date.now() / 60000)}`,
      );
      if (!res.ok) return page === 1 ? null : all.map((p) => mapStoreProduct(p, tree));
      const data = (await res.json()) as StoreProduct[];
      all.push(...data);
      const pages = Number(res.headers.get('x-wp-totalpages') ?? 1);
      if (page >= pages || data.length === 0) break;
    }
    return all.map((p) => mapStoreProduct(p, tree));
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
  modified?: string;
  categories: { nodes: { name: string }[] };
  featuredImage?: {
    node?: {
      sourceUrl?: string;
      altText?: string;
      mediaDetails?: { width?: number; height?: number } | null;
    };
  } | null;
}

export const POSTS_QUERY = `{
  posts(first: 100) {
    nodes {
      databaseId slug title excerpt content date modified
      categories { nodes { name } }
      featuredImage { node { sourceUrl altText mediaDetails { width height } } }
    }
  }
}`;

function postToGuide(p: GqlPost): Guide {
  const cat = p.categories.nodes[0]?.name ?? 'Guides';
  const type: Guide['type'] = cat === 'Materials' || cat === 'Design' ? cat : 'Guides';
  const body = articleBlocks(p.content ?? '');
  const date = p.date.slice(0, 10);
  const updated = p.modified?.slice(0, 10);
  const image = p.featuredImage?.node;
  const { width, height } = image?.mediaDetails ?? {};
  return {
    slug: p.slug,
    title: decode(p.title),
    summary: stripTags(p.excerpt) || stripTags(p.content ?? '').slice(0, 160),
    type,
    date,
    updated: updated && updated > date ? updated : undefined,
    minutes: Math.max(2, Math.round(wordCount(body) / 200)),
    cover: image?.sourceUrl
      ? {
          src: image.sourceUrl,
          alt: decode(image.altText ?? ''),
          ...(width && height ? { width, height } : {}),
        }
      : undefined,
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

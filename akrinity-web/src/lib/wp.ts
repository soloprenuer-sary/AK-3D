/**
 * Connection to WordPress + WooCommerce. Products come from the WooCommerce Store API, articles
 * from WPGraphQL. Both run at build time, so the static site contains the data. If WordPress
 * cannot be reached, callers fall back to the sample catalogue (see catalogue.ts).
 */
import type { ColourMode, Material, ShopProduct } from './shop-data';
import type { Block, Guide } from './guides-data';

const STORE_API = process.env.NEXT_PUBLIC_WC_STORE_API_URL ?? '';
const GRAPHQL = process.env.NEXT_PUBLIC_WP_GRAPHQL_URL ?? '';

/** WooCommerce Store API product (only the fields we use). */
interface StoreProduct {
  id: number;
  name: string;
  prices: { price: string; currency_minor_unit: number };
  is_in_stock: boolean;
  images: { src: string; alt: string }[];
  categories: { id: number; name: string }[];
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
  return decode(html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
}

function formatRupees(price: string, minorUnit: number): string {
  const value = Number(price) / 10 ** minorUnit;
  return `₹${Math.round(value).toLocaleString('en-IN')}`;
}

/** Products from the Store API, or null if WordPress cannot be reached. */
export async function fetchStoreProducts(): Promise<ShopProduct[] | null> {
  if (!STORE_API) return null;
  try {
    const res = await fetch(`${STORE_API}/products?per_page=100`);
    if (!res.ok) return null;
    const data = (await res.json()) as StoreProduct[];
    return data.map((p) => {
      const category = decode(p.categories[0]?.name ?? 'Home decor');
      return {
        id: `wc-${p.id}`,
        name: decode(p.name),
        category,
        sub: category,
        inStock: Boolean(p.is_in_stock),
        // Material, process and colour options are not stored in WooCommerce yet; defaults apply.
        material: 'PLA+' as Material,
        process: 'FDM',
        colours: ['black'],
        modes: ['single'] as ColourMode[],
        images: p.images.map((i) => i.src),
        price: formatRupees(p.prices.price, p.prices.currency_minor_unit),
      };
    });
  } catch {
    return null;
  }
}

interface GqlPost {
  databaseId: number;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  categories: { nodes: { name: string }[] };
}

const POSTS_QUERY = `{
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
  const body: Block[] = paragraphs.length ? paragraphs.map((t) => ({ t: 'p', text: t })) : [{ t: 'p', text }];
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
    return nodes.map(postToGuide);
  } catch {
    return null;
  }
}

/**
 * Category content that is edited in WordPress: the picture on each category and sub-category
 * (WooCommerce, Products > Categories) and the text fields (ACF fields on the same category).
 * Everything here is optional. Anything missing falls back to the default in category-themes.ts, and
 * when WordPress cannot be reached the functions return empty data instead of stopping the build.
 * The ACF field names are listed in docs/CATEGORY_ACF_FIELDS.md.
 */
import { CATEGORIES, categorySlug, subKey } from './shop-data';

const STORE_API = process.env.NEXT_PUBLIC_WC_STORE_API_URL ?? '';
const REVALIDATE = 60;

interface StoreCategory {
  id: number;
  name: string;
  slug: string;
  parent: number;
  image?: { src?: string } | null;
}

/** Text content for one category, from its ACF fields. Missing fields stay undefined. */
export interface CategoryCopy {
  tagline?: string;
  facts?: string[];
  /** For example "3 to 5 days". Shown in the header line. */
  leadTime?: string;
  heroImage?: string;
  tips?: { title: string; text: string }[];
  showTips: boolean;
  faq?: { q: string; a: string }[];
  showFaq: boolean;
  cta?: { title?: string; text?: string; label?: string; href?: string };
  seoTitle?: string;
  seoDescription?: string;
}

export interface CategoryContent {
  /** Picture per category or sub-category, keyed by subKey(name). */
  images: Record<string, string>;
  /** ACF text per category, keyed by subKey(name), for example "home-decor". */
  copy: Record<string, CategoryCopy>;
}

const EMPTY: CategoryContent = { images: {}, copy: {} };

function decode(s: string): string {
  return s
    .replace(/&#8217;|&rsquo;/g, '’')
    .replace(/&#8211;|&ndash;/g, '–')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'");
}

const text = (v: unknown): string | undefined =>
  typeof v === 'string' && v.trim() ? decode(v.trim()) : undefined;

const flag = (v: unknown): boolean => !(v === false || v === 0 || v === '0' || v === 'false');

/** An ACF image field can be a URL, an object with a url, or only an id (ignored). */
function imageUrl(v: unknown): string | undefined {
  if (typeof v === 'string' && /^https?:\/\//.test(v)) return v;
  if (v && typeof v === 'object' && typeof (v as { url?: unknown }).url === 'string')
    return (v as { url: string }).url;
  return undefined;
}

function parseCopy(raw: unknown): CategoryCopy | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const a = raw as Record<string, unknown>;
  const facts = [1, 2, 3].map((n) => text(a[`cat_fact_${n}`])).filter((x): x is string => Boolean(x));
  const tips = [1, 2, 3]
    .map((n) => ({ title: text(a[`cat_tip_${n}_title`]), text: text(a[`cat_tip_${n}_text`]) }))
    .filter((t): t is { title: string; text: string } => Boolean(t.title && t.text));
  const faq = [1, 2, 3, 4, 5]
    .map((n) => ({ q: text(a[`cat_faq_${n}_q`]), a: text(a[`cat_faq_${n}_a`]) }))
    .filter((f): f is { q: string; a: string } => Boolean(f.q && f.a));
  const cta = {
    title: text(a.cat_cta_title),
    text: text(a.cat_cta_text),
    label: text(a.cat_cta_label),
    href: text(a.cat_cta_link),
  };
  return {
    tagline: text(a.cat_tagline),
    facts: facts.length ? facts : undefined,
    leadTime: text(a.cat_lead_time),
    heroImage: imageUrl(a.cat_hero_image),
    tips: tips.length ? tips : undefined,
    showTips: flag(a.cat_show_tips),
    faq: faq.length ? faq : undefined,
    showFaq: flag(a.cat_show_faq),
    cta: Object.values(cta).some(Boolean) ? cta : undefined,
    seoTitle: text(a.cat_seo_title),
    seoDescription: text(a.cat_seo_description),
  };
}

/** Pictures and text for every category. Never throws. */
export async function getCategoryContent(): Promise<CategoryContent> {
  if (!STORE_API) return EMPTY;
  const wpV2 = STORE_API.replace(/\/wc\/store\/v1\/?$/, '/wp/v2');
  const get = async (url: string): Promise<unknown> => {
    try {
      const res = await fetch(url, {
        next: { revalidate: REVALIDATE },
        signal: AbortSignal.timeout(15000),
      });
      return res.ok ? await res.json() : null;
    } catch {
      return null;
    }
  };
  const [storeCats, acfCats] = await Promise.all([
    get(`${STORE_API}/products/categories?per_page=100`),
    get(`${wpV2}/product_cat?per_page=100&_fields=id,name,slug,acf`),
  ]);

  const images: Record<string, string> = {};
  if (Array.isArray(storeCats)) {
    for (const c of storeCats as StoreCategory[]) {
      const src = c.image?.src;
      if (src) images[subKey(decode(c.name))] = src;
    }
  }
  const copy: Record<string, CategoryCopy> = {};
  if (Array.isArray(acfCats)) {
    for (const c of acfCats as { name?: string; acf?: unknown }[]) {
      const parsed = parseCopy(c.acf);
      if (parsed && c.name) copy[subKey(decode(c.name))] = parsed;
    }
  }
  return { images, copy };
}

/** One main category in the menu, with its sub-categories. */
export interface MenuCategory {
  name: string;
  slug: string;
  image?: string;
  subs: { name: string; key: string; image?: string }[];
}

export function buildMenu(content: CategoryContent): MenuCategory[] {
  return CATEGORIES.map((c) => ({
    name: c.name,
    slug: categorySlug(c),
    image: content.images[subKey(c.name)],
    subs: c.subs.map((s) => ({ name: s, key: subKey(s), image: content.images[subKey(s)] })),
  }));
}

/** The menu data for the header. Works without WordPress (no pictures then). */
export async function getMenu(): Promise<MenuCategory[]> {
  return buildMenu(await getCategoryContent());
}

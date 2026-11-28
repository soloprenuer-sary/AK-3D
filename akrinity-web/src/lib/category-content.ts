/**
 * Categories, their pictures and their text, all edited in WordPress:
 *  - Products > Categories: the main categories (no parent), their sub-categories (children), the
 *    thumbnail picture and the description.
 *  - ACF fields on each category (names in docs/CATEGORY_ACF_FIELDS.md): menu group, "popular in the
 *    menu", order, short menu name, and the text on the category page.
 * When WordPress is unreachable, or has no main category with sub-categories yet, the built-in list in
 * shop-data.ts is used, so the site never breaks. Nothing here throws.
 */
import { CATEGORIES, localSubImage, type ShopCategory } from './shop-data';

const STORE_API = process.env.NEXT_PUBLIC_WC_STORE_API_URL ?? '';
const REVALIDATE = 60;
const TONES = ['var(--accent)', 'var(--violet)', 'var(--orange)', 'var(--ink)'];

interface StoreCategory {
  id: number;
  name: string;
  slug: string;
  parent: number;
  description?: string;
  image?: { src?: string } | null;
}

/** Text and menu settings for one category, from its ACF fields. Missing fields stay undefined. */
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
  /** Menu settings. */
  menuLabel?: string;
  menuGroup?: string;
  popular?: boolean;
  menuOrder?: number;
}

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

const stripTags = (s: string) =>
  decode(
    s
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim(),
  );

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

export function parseCopy(raw: unknown): CategoryCopy | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const a = raw as Record<string, unknown>;
  const facts = [1, 2, 3]
    .map((n) => text(a[`cat_fact_${n}`]))
    .filter((x): x is string => Boolean(x));
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
  const order = Number(a.cat_menu_order);
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
    menuLabel: text(a.cat_menu_label),
    menuGroup: text(a.cat_menu_group),
    popular:
      a.cat_popular === true || a.cat_popular === 1 || a.cat_popular === '1' ? true : undefined,
    menuOrder:
      a.cat_menu_order !== undefined && a.cat_menu_order !== '' && Number.isFinite(order)
        ? order
        : undefined,
  };
}

async function getJson(url: string): Promise<unknown> {
  try {
    const res = await fetch(url, {
      next: { revalidate: REVALIDATE },
      signal: AbortSignal.timeout(15000),
    });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

/** The raw categories and their ACF fields. Both are null when WordPress cannot be reached. */
async function fetchCategoryData(): Promise<{
  cats: StoreCategory[] | null;
  copy: Map<number, CategoryCopy>;
}> {
  if (!STORE_API) return { cats: null, copy: new Map() };
  const wpV2 = STORE_API.replace(/\/wc\/store\/v1\/?$/, '/wp/v2');
  const [cats, acf] = await Promise.all([
    // hide_empty=false: the Store API hides categories with no products by default
    getJson(
      `${STORE_API}/products/categories?per_page=100&hide_empty=false&_t=${Math.floor(Date.now() / 60000)}`,
    ),
    getJson(`${wpV2}/product_cat?per_page=100&_fields=id,acf&_t=${Math.floor(Date.now() / 60000)}`),
  ]);
  const copy = new Map<number, CategoryCopy>();
  if (Array.isArray(acf)) {
    for (const row of acf as { id?: number; acf?: unknown }[]) {
      const parsed = parseCopy(row.acf);
      if (parsed && typeof row.id === 'number') copy.set(row.id, parsed);
    }
  }
  return { cats: Array.isArray(cats) ? (cats as StoreCategory[]) : null, copy };
}

/**
 * The category tree the whole site uses: main categories with their sub-categories, in the order set
 * in WordPress (ACF "menu order", then name). Falls back to the built-in list.
 */
export async function getCategoryTree(): Promise<ShopCategory[]> {
  const { cats, copy } = await fetchCategoryData();
  if (!cats) return CATEGORIES;
  const list = cats.filter((c) => c.slug !== 'uncategorized');
  const mains = list.filter((c) => !c.parent);
  const kids = list.filter((c) => c.parent);
  if (!mains.some((m) => kids.some((k) => k.parent === m.id))) return CATEGORIES;

  const order = (c: StoreCategory) => copy.get(c.id)?.menuOrder ?? 100;
  const byOrder = (a: StoreCategory, b: StoreCategory) =>
    order(a) - order(b) || a.name.localeCompare(b.name);

  return [...mains].sort(byOrder).map((m, i) => {
    const subs = kids.filter((k) => k.parent === m.id).sort(byOrder);
    const builtIn = CATEGORIES.find((c) => c.slug === m.slug);
    const picked = subs.filter((s) => copy.get(s.id)?.popular);
    return {
      name: decode(m.name),
      slug: m.slug,
      id: m.id,
      description: stripTags(m.description ?? '') || builtIn?.description || '',
      menuLabel: copy.get(m.id)?.menuLabel,
      tone: TONES[i % TONES.length],
      image: m.image?.src || undefined,
      subs: subs.map((s) => decode(s.name)),
      subInfo: subs.map((s, j) => ({
        name: decode(s.name),
        slug: s.slug,
        id: s.id,
        image: s.image?.src || localSubImage(m.slug, s.slug),
        group: copy.get(s.id)?.menuGroup,
        // Ticked "popular" ones, or the first four when none is ticked.
        popular: picked.length ? picked.includes(s) : j < 4,
      })),
    };
  });
}

/** Page text for every category, keyed by category slug. Never throws. */
export async function getCategoryCopy(): Promise<Record<string, CategoryCopy>> {
  const { cats, copy } = await fetchCategoryData();
  const out: Record<string, CategoryCopy> = {};
  for (const c of cats ?? []) {
    const v = copy.get(c.id);
    if (v) out[c.slug] = v;
  }
  return out;
}

/** One entry in the menu. */
export interface MenuItem {
  name: string;
  slug: string;
  image?: string;
}

/** One main category in the menu: four picture tiles, then everything in grouped lists. */
export interface MenuCategory {
  name: string;
  /** Name shown in the top bar. */
  label: string;
  slug: string;
  tone: string;
  popular: MenuItem[];
  groups: { title: string; items: MenuItem[] }[];
}

export function buildMenu(tree: ShopCategory[]): MenuCategory[] {
  return tree.map((c) => {
    const items = c.subInfo.map((s) => ({
      name: s.name,
      slug: s.slug,
      image: s.image,
      group: s.group ?? '',
    }));
    const groups: MenuCategory['groups'] = [];
    for (const it of items) {
      let g = groups.find((x) => x.title === it.group);
      if (!g) groups.push((g = { title: it.group, items: [] }));
      g.items.push({ name: it.name, slug: it.slug, image: it.image });
    }
    return {
      name: c.name,
      label: c.menuLabel || c.name,
      slug: c.slug,
      tone: c.tone,
      popular: c.subInfo
        .filter((s) => s.popular)
        .slice(0, 4)
        .map((s) => ({ name: s.name, slug: s.slug, image: s.image })),
      groups,
    };
  });
}

/**
 * Turns the product text WooCommerce stores as HTML (short description, long description and
 * attributes) into plain structures the product page can show safely, without inserting raw HTML.
 */

/** One piece of the long description. */
export type DescBlock =
  | { t: 'h'; text: string }
  | { t: 'p'; text: string }
  | { t: 'ul'; items: string[] }
  | { t: 'img'; src: string; alt: string };

export interface ProductSpec {
  name: string;
  value: string;
}

const ENTITIES: Record<string, string> = {
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

export function decodeEntities(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n: string) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, n: string) => ENTITIES[n.toLowerCase()] ?? m);
}

/** Text of an HTML fragment: tags removed, entities decoded, spaces tidied. */
export function plainText(html: string): string {
  return decodeEntities(
    html
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim(),
  );
}

/** The text of each list item in an HTML fragment. */
export function listItems(html: string): string[] {
  const out: string[] = [];
  const re = /<li\b[^>]*>([\s\S]*?)<\/li>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const t = plainText(m[1]);
    if (t) out.push(t);
  }
  return out;
}

const MAX_IMAGES = 12;

/** The long description as headings, paragraphs, bullet lists and pictures, in order. */
export function htmlToBlocks(html: string): DescBlock[] {
  const blocks: DescBlock[] = [];
  const clean = html.replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, '');
  const re = /<(h[1-6]|p|ul|ol)\b[^>]*>([\s\S]*?)<\/\1>/gi;
  let images = 0;
  let found = false;
  let m: RegExpExecArray | null;
  while ((m = re.exec(clean))) {
    found = true;
    const tag = m[1].toLowerCase();
    const inner = m[2];
    if (tag.startsWith('h')) {
      const text = plainText(inner);
      if (text) blocks.push({ t: 'h', text });
    } else if (tag === 'ul' || tag === 'ol') {
      const items = listItems(inner);
      if (items.length) blocks.push({ t: 'ul', items });
    } else {
      const imgRe = /<img\b[^>]*>/gi;
      let im: RegExpExecArray | null;
      while ((im = imgRe.exec(inner)) && images < MAX_IMAGES) {
        const src = /\bsrc\s*=\s*["']([^"']+)["']/i.exec(im[0])?.[1] ?? '';
        const alt = /\balt\s*=\s*["']([^"']*)["']/i.exec(im[0])?.[1] ?? '';
        if (/^(https:\/\/|http:\/\/localhost[:/])/i.test(src)) {
          blocks.push({ t: 'img', src, alt: decodeEntities(alt) });
          images++;
        }
      }
      const text = plainText(inner.replace(/<img\b[^>]*>/gi, ' '));
      if (text) blocks.push({ t: 'p', text });
    }
  }
  if (!found) {
    const text = plainText(clean);
    if (text) blocks.push({ t: 'p', text });
  }
  return blocks;
}

/** Attributes that are choices on the page, or internal flags, and so are not listed as specifications. */
const NOT_A_SPEC = /unspsc|colou?r (mode|option)|licen[cs]e status|personali[sz]ation/i;

/** The specifications table: size and weight first, then every product attribute with a value. */
export function buildSpecs(
  attributes: { name: string; terms: { name: string }[] }[] | undefined,
  weight: string | undefined,
  dimensions: string | undefined,
): ProductSpec[] {
  const specs: ProductSpec[] = [];
  const dims = (dimensions ?? '').trim();
  if (dims && !/^n\/a$/i.test(dims)) specs.push({ name: 'Dimensions (L × W × H)', value: dims });
  const kg = (weight ?? '').trim();
  if (kg && !/^n\/a$/i.test(kg)) specs.push({ name: 'Weight', value: kg });
  for (const a of attributes ?? []) {
    if (NOT_A_SPEC.test(a.name)) continue;
    const value = a.terms
      .map((t) =>
        decodeEntities(t.name)
          .replace(/\s*Report an incorrect code\s*$/i, '')
          .trim(),
      )
      .filter(Boolean)
      .join(', ');
    if (value) specs.push({ name: decodeEntities(a.name), value });
  }
  return specs;
}

/** "SECURE WALL MOUNT: Holes on both ends." splits into a label and the rest, so the label can be bold. */
export function splitLabel(item: string): { label: string; rest: string } | null {
  const m = /^([A-Z0-9][A-Z0-9 \-&,/+']{3,60}):\s+(.+)$/.exec(item);
  if (!m) return null;
  const lower = m[1].toLowerCase().replace(/\b3d\b/g, '3D');
  return { label: lower.charAt(0).toUpperCase() + lower.slice(1), rest: m[2] };
}

/* ---------- Product page content fields (ACF, sent by the WordPress snippet) ---------- */

export interface ContentPicture {
  id: number;
  /** Picture sized for the page. */
  url: string;
  full: string;
  width: number;
  height: number;
  alt: string;
  /** Text shown over the picture. */
  caption: string;
}

/**
 * What the owner fills in on the product in WordPress (extensions.akrinity_content in the Store API).
 * All text is plain, with no HTML. hasContent is false for products that have not been filled in; those
 * keep the older description box.
 */
export interface ProductContent {
  /** "pictures" when the product has A+ pictures, otherwise "text". */
  layout: 'pictures' | 'text';
  features: string[];
  description: string[];
  package: string[];
  about: { title: string; text: string }[];
  details: { label: string; value: string }[];
  pictures: ContentPicture[];
  specs: { label: string; value: string }[];
  hasContent: boolean;
}

const strings = (v: unknown): string[] =>
  Array.isArray(v)
    ? v.filter((x): x is string => typeof x === 'string' && x.trim() !== '').map((x) => x.trim())
    : [];

const rows = (v: unknown, a: string, b: string): Record<string, string>[] =>
  Array.isArray(v)
    ? v
        .filter((x): x is Record<string, unknown> => Boolean(x) && typeof x === 'object')
        .map((x) => ({ [a]: String(x[a] ?? '').trim(), [b]: String(x[b] ?? '').trim() }))
        .filter((x) => x[a] !== '' || x[b] !== '')
    : [];

/** Reads the content fields defensively: a missing or odd value becomes an empty list. */
export function parseProductContent(raw: unknown): ProductContent | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const r = raw as Record<string, unknown>;
  const pictures = (Array.isArray(r.pictures) ? r.pictures : [])
    .filter((x): x is Record<string, unknown> => Boolean(x) && typeof x === 'object')
    .map((x) => ({
      id: Number(x.id ?? 0),
      url: String(x.url ?? x.full ?? ''),
      full: String(x.full ?? x.url ?? ''),
      width: Number(x.width ?? 0),
      height: Number(x.height ?? 0),
      alt: String(x.alt ?? ''),
      caption: String(x.caption ?? ''),
    }))
    .filter((x) => /^https?:\/\//.test(x.url));
  return {
    layout: r.layout === 'pictures' ? 'pictures' : 'text',
    features: strings(r.features),
    description: strings(r.description),
    package: strings(r.package),
    about: rows(r.about, 'title', 'text').map((x) => ({ title: x.title, text: x.text })),
    details: rows(r.details, 'label', 'value').map((x) => ({ label: x.label, value: x.value })),
    pictures,
    specs: rows(r.specs, 'label', 'value').map((x) => ({ label: x.label, value: x.value })),
    hasContent: r.has_content === true,
  };
}

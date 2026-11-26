/**
 * Turns the HTML of a WordPress post into plain structures the article page can show safely: only
 * the elements listed in `Block` survive, and no raw HTML is ever inserted into the page. Pure, so
 * it runs on the server and in the browser.
 */
import { decodeEntities } from './product-content';

/** A run of text, optionally bold, italic, or a link. */
export interface Inline {
  text: string;
  href?: string;
  b?: boolean;
  i?: boolean;
}

export type Block =
  | { t: 'p'; content: Inline[] }
  | { t: 'h2'; text: string }
  | { t: 'h3'; text: string }
  | { t: 'ul'; items: Inline[][] }
  | { t: 'ol'; items: Inline[][] }
  /** A WordPress "Quote" block, shown as a highlighted box. */
  | { t: 'tip'; content: Inline[][] }
  | { t: 'img'; src: string; alt: string; caption?: string; width?: number; height?: number }
  | { t: 'table'; head: Inline[][]; rows: Inline[][][] };

interface Node {
  tag: string;
  attrs: Record<string, string>;
  children: (Node | string)[];
}

const VOID = new Set(['br', 'hr', 'img', 'input', 'meta', 'link', 'source', 'col', 'wbr']);
/** Opening one of these closes an unfinished one of the same kind (for HTML with missing end tags). */
const SELF_CLOSING = new Set(['p', 'li', 'tr', 'td', 'th']);

/** A small, forgiving HTML reader. Comments, scripts and styles are dropped. */
function parse(html: string): Node {
  const root: Node = { tag: 'root', attrs: {}, children: [] };
  const stack: Node[] = [root];
  const clean = html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(script|style|noscript|template)\b[\s\S]*?<\/\1\s*>/gi, '');
  const re = /<(\/?)([a-zA-Z][a-zA-Z0-9-]*)((?:"[^"]*"|'[^']*'|[^'">])*)>|([^<]+|<)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(clean))) {
    const top = stack[stack.length - 1];
    if (m[4] !== undefined) {
      top.children.push(m[4]);
      continue;
    }
    const tag = m[2].toLowerCase();
    if (m[1]) {
      for (let i = stack.length - 1; i > 0; i--) {
        if (stack[i].tag === tag) {
          stack.length = i;
          break;
        }
      }
      continue;
    }
    const attrs: Record<string, string> = {};
    const attrRe = /([a-zA-Z_:][\w:.-]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;
    let a: RegExpExecArray | null;
    while ((a = attrRe.exec(m[3]))) {
      attrs[a[1].toLowerCase()] = decodeEntities(a[2] ?? a[3] ?? a[4] ?? '');
    }
    if (SELF_CLOSING.has(tag) && top.tag === tag) stack.pop();
    const node: Node = { tag, attrs, children: [] };
    stack[stack.length - 1].children.push(node);
    if (!VOID.has(tag) && !/\/\s*$/.test(m[3])) stack.push(node);
  }
  return root;
}

const isNode = (c: Node | string): c is Node => typeof c !== 'string';

function find(node: Node, tag: string, out: Node[] = []): Node[] {
  for (const c of node.children) {
    if (!isNode(c)) continue;
    if (c.tag === tag) out.push(c);
    else find(c, tag, out);
  }
  return out;
}

/** Links may point at this site, a secure address, or an email address. Anything else is dropped. */
function safeHref(href: string | undefined): string | undefined {
  const h = (href ?? '').trim();
  return /^(\/(?!\/)|#|https:\/\/|mailto:)/i.test(h) ? h : undefined;
}

const safeSrc = (src: string): boolean =>
  /^(https:\/\/|http:\/\/localhost[:/]|\/(?!\/))/i.test(src);

/** The text of an element as runs, keeping bold, italic and links. */
function inline(nodes: (Node | string)[], style: Omit<Inline, 'text'> = {}): Inline[] {
  const out: Inline[] = [];
  for (const c of nodes) {
    if (!isNode(c)) {
      out.push({ ...style, text: decodeEntities(c) });
    } else if (c.tag === 'br') {
      out.push({ ...style, text: ' ' });
    } else if (c.tag !== 'img') {
      const next = { ...style };
      if (c.tag === 'strong' || c.tag === 'b') next.b = true;
      if (c.tag === 'em' || c.tag === 'i') next.i = true;
      if (c.tag === 'a') next.href = safeHref(c.attrs.href) ?? style.href;
      out.push(...inline(c.children, next));
    }
  }
  return out;
}

/** Collapses spaces the way a browser would and trims the ends. Returns [] when nothing is left. */
function tidy(runs: Inline[]): Inline[] {
  const out: Inline[] = [];
  let space = true;
  for (const r of runs) {
    let text = r.text.replace(/\s+/g, ' ');
    if (space) text = text.replace(/^ /, '');
    if (!text) continue;
    space = text.endsWith(' ');
    const run: Inline = { text };
    if (r.href) run.href = r.href;
    if (r.b) run.b = true;
    if (r.i) run.i = true;
    out.push(run);
  }
  const last = out[out.length - 1];
  if (last) {
    last.text = last.text.replace(/ $/, '');
    if (!last.text) out.pop();
  }
  return out;
}

export const inlineText = (runs: Inline[]): string => runs.map((r) => r.text).join('');
const textOf = (node: Node): string => inlineText(tidy(inline(node.children)));

function picture(img: Node, caption?: string): Block | null {
  const src = img.attrs.src ?? '';
  if (!safeSrc(src)) return null;
  const width = Number(img.attrs.width);
  const height = Number(img.attrs.height);
  return {
    t: 'img',
    src,
    alt: img.attrs.alt ?? '',
    ...(caption ? { caption } : {}),
    ...(width > 0 && height > 0 ? { width, height } : {}),
  };
}

function table(node: Node): Block | null {
  const all = find(node, 'tr').map((tr) =>
    tr.children.filter(isNode).filter((c) => c.tag === 'td' || c.tag === 'th'),
  );
  const rows = all.filter((cells) => cells.length > 0);
  if (!rows.length) return null;
  const cells = rows.map((r) => r.map((c) => tidy(inline(c.children))));
  const hasHead = find(node, 'thead').length > 0 || rows[0].every((c) => c.tag === 'th');
  return { t: 'table', head: hasHead ? cells[0] : [], rows: hasHead ? cells.slice(1) : cells };
}

const isList = (c: Node | string): c is Node => isNode(c) && (c.tag === 'ul' || c.tag === 'ol');

/** The items of a list in reading order; items of a list inside a list follow their parent. */
function listItems(list: Node): Inline[][] {
  return list.children
    .filter(isNode)
    .filter((li) => li.tag === 'li')
    .flatMap((li) => [
      tidy(inline(li.children.filter((c) => !isList(c)))),
      ...li.children.filter(isList).flatMap(listItems),
    ])
    .filter((i) => i.length > 0);
}

/** The paragraphs of a quote box. A list inside it becomes one line per item. */
function quoteLines(quote: Node): Inline[][] {
  const lines: Inline[][] = [];
  let loose: (Node | string)[] = [];
  const flush = () => {
    lines.push(tidy(inline(loose)));
    loose = [];
  };
  for (const c of quote.children) {
    if (isList(c)) {
      flush();
      lines.push(...listItems(c));
    } else if (isNode(c) && c.tag === 'p') {
      flush();
      lines.push(tidy(inline(c.children)));
    } else loose.push(c);
  }
  flush();
  return lines.filter((l) => l.length > 0);
}

const BLOCK_TAGS =
  /^(p|h[1-6]|ul|ol|blockquote|figure|table|div|section|article|pre|img|hr|aside|main)$/;

function walk(nodes: (Node | string)[], out: Block[]): void {
  // Loose text and inline elements between blocks are gathered into a paragraph.
  let loose: (Node | string)[] = [];
  const flush = () => {
    const content = tidy(inline(loose));
    if (content.length) out.push({ t: 'p', content });
    loose = [];
  };
  for (const c of nodes) {
    if (!isNode(c) || !BLOCK_TAGS.test(c.tag)) {
      if (isNode(c) && find(c, 'img').length) {
        // A picture wrapped in a link.
        flush();
        walk(c.children, out);
      } else loose.push(c);
      continue;
    }
    flush();
    if (c.tag === 'p' || c.tag === 'pre') {
      for (const img of find(c, 'img')) {
        const b = picture(img);
        if (b) out.push(b);
      }
      const content = tidy(inline(c.children));
      if (content.length) out.push({ t: 'p', content });
    } else if (/^h[1-6]$/.test(c.tag)) {
      const text = textOf(c);
      // The page title is the only h1, so headings inside the article start at h2.
      if (text) out.push({ t: c.tag === 'h1' || c.tag === 'h2' ? 'h2' : 'h3', text });
    } else if (c.tag === 'ul' || c.tag === 'ol') {
      const items = listItems(c);
      if (items.length) out.push({ t: c.tag, items });
    } else if (c.tag === 'blockquote') {
      const content = quoteLines(c);
      if (content.length) out.push({ t: 'tip', content });
    } else if (c.tag === 'table') {
      const b = table(c);
      if (b) out.push(b);
    } else if (c.tag === 'img') {
      const b = picture(c);
      if (b) out.push(b);
    } else if (c.tag === 'figure') {
      const images = find(c, 'img');
      const cap = find(c, 'figcaption')[0];
      const caption = cap ? textOf(cap) : undefined;
      if (images.length) {
        images.forEach((img, i) => {
          const b = picture(img, i === images.length - 1 ? caption : undefined);
          if (b) out.push(b);
        });
      } else walk(c.children, out);
    } else {
      walk(c.children, out);
    }
  }
  flush();
}

export function articleBlocks(html: string): Block[] {
  const out: Block[] = [];
  walk(parse(html).children, out);
  return out;
}

/** Words in the article, for the reading time. */
export function wordCount(blocks: Block[]): number {
  const parts: string[] = [];
  for (const b of blocks) {
    if (b.t === 'p') parts.push(inlineText(b.content));
    else if (b.t === 'h2' || b.t === 'h3') parts.push(b.text);
    else if (b.t === 'ul' || b.t === 'ol' || b.t === 'tip') {
      parts.push(...(b.t === 'tip' ? b.content : b.items).map(inlineText));
    } else if (b.t === 'table') parts.push(...[b.head, ...b.rows].flat().map(inlineText));
    else if (b.caption) parts.push(b.caption);
  }
  return parts.join(' ').split(/\s+/).filter(Boolean).length;
}

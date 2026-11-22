'use client';

import { useEffect, useState } from 'react';
import type { ShopProduct } from '@/lib/shop-data';
import type { DescBlock, ProductContent } from '@/lib/product-content';
import { DescStage, type StagePicture } from './DescStage';

/** The four specs shown as big tiles, in this order. */
const FACTS: { match: RegExp; label: string }[] = [
  { match: /^dimensions/i, label: 'Size' },
  { match: /^weight/i, label: 'Weight' },
  { match: /^material/i, label: 'Material' },
  { match: /^colou?r$/i, label: 'Colour' },
];
const TILE_CLASS = ['t-lime', 't-violet', 't-orange', 't-ink'];

/** The A+ section blocks: a heading and its text each. */
function aboutBlocks(c: ProductContent): DescBlock[] {
  const out: DescBlock[] = [];
  for (const a of c.about) {
    if (a.title) out.push({ t: 'h', text: a.title });
    if (a.text) out.push({ t: 'p', text: a.text });
  }
  return out;
}

/** The Product details lines. */
function detailBlocks(c: ProductContent): DescBlock[] {
  if (!c.details.length) return [];
  return [
    { t: 'h', text: 'Product details' },
    { t: 'ul', items: c.details.map((d) => (d.label ? `${d.label}: ${d.value}` : d.value)) },
  ];
}

/**
 * Everything under the buy area: a sticky section menu, the key facts as tiles, the description (text
 * on the left, pictures and a short summary on the right that stay in view while you read) and the
 * specification list. A product filled in with the content fields in WordPress uses those; older
 * products use their description box and attributes.
 */
export function ProductMore({ product }: { product: ShopProduct }) {
  const content = product.content?.hasContent ? product.content : undefined;
  const specs = product.specs ?? [];

  const facts = FACTS.map((f) => {
    const s = specs.find((x) => f.match.test(x.name));
    return s ? { label: f.label, value: s.value, name: s.name } : null;
  }).filter((x): x is { label: string; value: string; name: string } => Boolean(x));
  const factNames = new Set(facts.map((f) => f.name));
  const rest = specs.filter((s) => !factNames.has(s.name));

  // Text for the left column, pictures and summary cards for the right column.
  let blocks: DescBlock[] = [];
  let pictures: StagePicture[] = [];

  if (content) {
    const usable = content.pictures.filter(
      (p) => !(p.width > 0 && p.height > 0 && p.width / p.height > 2.4),
    );
    pictures = usable.map((p) => ({ src: p.url, alt: p.alt, caption: p.caption }));
    // The right side holds only the A+ pictures (when there are any); the text always lives on the left.
    const keyFeatures: DescBlock[] = content.features.length
      ? [
          { t: 'h', text: 'Key features' },
          { t: 'ul', items: content.features },
        ]
      : [];
    const inTheBox: DescBlock[] = content.package.length
      ? [
          { t: 'h', text: 'Package includes' },
          { t: 'ul', items: content.package },
        ]
      : [];
    // Everything the owner wrote shows on the description side, in the order of the WordPress box:
    // key features, intro, the section blocks, package, product details.
    // The first intro paragraph is the lead; any others follow as normal text.
    const intro = content.description.map(
      (t, i) => ({ t: i === 0 ? 'lead' : 'p', text: t }) as DescBlock,
    );
    blocks = [
      ...keyFeatures,
      ...intro,
      ...aboutBlocks(content),
      ...inTheBox,
      ...detailBlocks(content),
    ];
  } else {
    const all = product.longDescription ?? [];
    blocks = all.filter((b) => b.t !== 'img');
    pictures = all
      .filter((b): b is Extract<DescBlock, { t: 'img' }> => b.t === 'img')
      .map((b) => ({ src: b.src, alt: b.alt, caption: '' }));
  }
  const hasDesc = blocks.length > 0;

  // The specs table: the owner's own rows, or (older products) the attributes when there are at least three.
  const specRows = content
    ? content.specs.map((s) => ({ name: s.label, value: s.value }))
    : rest.length >= 3
      ? rest
      : [];
  const showSpecs = specRows.length > 0;

  const items = [
    hasDesc && { id: 'about', label: 'Description' },
    showSpecs && { id: 'specs', label: 'Specifications' },
    { id: 'shipping', label: 'Shipping and returns' },
    { id: 'reviews', label: 'Reviews' },
  ].filter(Boolean) as { id: string; label: string }[];

  const [active, setActive] = useState(items[0]?.id ?? '');
  useEffect(() => {
    const els = items
      .map((i) => document.getElementById(i.id))
      .filter((e): e is HTMLElement => Boolean(e));
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        const seen = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (seen) setActive(seen.target.id);
      },
      { rootMargin: '-35% 0px -55% 0px' },
    );
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
    // items is rebuilt each render from the same product
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  if (!hasDesc && !showSpecs && facts.length === 0) return null;

  return (
    <>
      <nav className="pdp-nav" aria-label="On this page">
        <div className="wrap pdp-nav-in">
          {items.map((i) => (
            <a key={i.id} href={`#${i.id}`} aria-current={active === i.id ? 'true' : undefined}>
              {i.label}
            </a>
          ))}
        </div>
      </nav>

      {facts.length > 0 && (
        <section className="wrap pdp-facts" aria-label="Key facts">
          {facts.map((f, i) => (
            <div key={f.label} className={`fact ${TILE_CLASS[i % TILE_CLASS.length]}`}>
              <span className="fact-l">{f.label}</span>
              <b className="fact-v">{f.value}</b>
            </div>
          ))}
        </section>
      )}

      {hasDesc && (
        <section className="wrap pdp-desc" id="about" aria-labelledby="about-h">
          <h2 className="d" id="about-h">
            About this <span className="hl">product</span>
          </h2>
          <DescStage blocks={blocks} pictures={pictures} />
        </section>
      )}

      {showSpecs && (
        <section className="wrap pdp-specs2" id="specs" aria-labelledby="specs-h">
          <h2 className="d" id="specs-h">
            Product <span className="hl">specs</span>
          </h2>
          <dl className="spec-grid">
            {specRows.map((s, i) => (
              <div key={`${s.name}-${i}`}>
                <dt>{s.name}</dt>
                <dd>{s.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}
    </>
  );
}

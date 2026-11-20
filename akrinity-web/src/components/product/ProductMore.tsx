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

/** A+ content: the About blocks, then the Product details lines. */
function aboutBlocks(c: ProductContent): DescBlock[] {
  const out: DescBlock[] = [];
  for (const a of c.about) {
    if (a.title) out.push({ t: 'h', text: a.title });
    if (a.text) out.push({ t: 'p', text: a.text });
  }
  if (c.details.length) {
    out.push({ t: 'h', text: 'Product details' });
    out.push({
      t: 'ul',
      items: c.details.map((d) => (d.label ? `${d.label}: ${d.value}` : d.value)),
    });
  }
  return out;
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
    // The right side holds only pictures, so the lists live in the text on the left.
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
    if (content.layout === 'pictures' && usable.length > 0) {
      blocks = [...aboutBlocks(content), ...keyFeatures, ...inTheBox];
    } else {
      const paragraphs = content.description.map((p) => ({ t: 'p', text: p }) as DescBlock);
      blocks = [...keyFeatures, ...paragraphs, ...inTheBox];
    }
  } else {
    const all = product.longDescription ?? [];
    blocks = all.filter((b) => b.t !== 'img');
    pictures = all
      .filter((b): b is Extract<DescBlock, { t: 'img' }> => b.t === 'img')
      .map((b) => ({ src: b.src, alt: b.alt, caption: '' }));
  }
  // No A+ pictures: the normal product photos fill the picture area.
  if (pictures.length === 0 && (product.images?.length ?? 0) > 0) {
    pictures = (product.images ?? [])
      .slice(0, 8)
      .map((src) => ({ src, alt: product.name, caption: '' }));
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

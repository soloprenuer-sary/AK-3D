'use client';

import { useEffect, useState } from 'react';
import type { ShopProduct } from '@/lib/shop-data';
import type { DescBlock } from '@/lib/product-content';

/** A picture from the long description. Wide banners and logo strips (more than 2.4 times wider than tall) are hidden. */
function DescImage({ src, alt, wide }: { src: string; alt: string; wide: boolean }) {
  const [hide, setHide] = useState(false);
  const [failed, setFailed] = useState(false);
  if (hide || failed) return null;
  return (
    <figure className={wide ? 'desc-fig wide' : 'desc-fig'}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        referrerPolicy="no-referrer"
        onLoad={(e) => {
          const im = e.currentTarget;
          if (im.naturalHeight > 0 && im.naturalWidth / im.naturalHeight > 2.4) setHide(true);
        }}
        onError={() => setFailed(true)}
      />
    </figure>
  );
}

/** The four specs shown as big tiles, in this order. */
const FACTS: { match: RegExp; label: string }[] = [
  { match: /^dimensions/i, label: 'Size' },
  { match: /^weight/i, label: 'Weight' },
  { match: /^material/i, label: 'Material' },
  { match: /^colou?r$/i, label: 'Colour' },
];
const TILE_CLASS = ['t-lime', 't-violet', 't-orange', 't-ink'];

function Prose({ blocks }: { blocks: DescBlock[] }) {
  return (
    <div className="prose">
      {blocks.map((b, i) => {
        if (b.t === 'h') return <h3 key={i}>{b.text}</h3>;
        if (b.t === 'p') return <p key={i}>{b.text}</p>;
        if (b.t === 'ul')
          return (
            <ul key={i} className="ticks">
              {b.items.map((it) => (
                <li key={it}>{it}</li>
              ))}
            </ul>
          );
        return null;
      })}
    </div>
  );
}

/**
 * Everything under the buy area: a sticky section menu, the key facts as tiles, the description with
 * its pictures in a grid beside the text, and the full specification list.
 */
export function ProductMore({ product }: { product: ShopProduct }) {
  const blocks = product.longDescription ?? [];
  const text = blocks.filter((b) => b.t !== 'img');
  const images = blocks.filter((b): b is Extract<DescBlock, { t: 'img' }> => b.t === 'img');
  const specs = product.specs ?? [];

  const facts = FACTS.map((f) => {
    const s = specs.find((x) => f.match.test(x.name));
    return s ? { label: f.label, value: s.value, name: s.name } : null;
  }).filter((x): x is { label: string; value: string; name: string } => Boolean(x));
  const factNames = new Set(facts.map((f) => f.name));
  const rest = specs.filter((s) => !factNames.has(s.name));

  const hasDesc = text.length > 0 || images.length > 0;
  // A short table with one or two rows looks empty, so the specs section needs at least three extra rows.
  const showSpecs = rest.length >= 3;
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
          <div className={images.length && text.length ? 'pdp-desc-grid' : 'pdp-desc-grid one'}>
            {text.length > 0 && (
              <div className="pdp-desc-text">
                <h2 className="d" id="about-h">
                  About this <span className="hl">product</span>
                </h2>
                <Prose blocks={text} />
              </div>
            )}
            {images.length > 0 && (
              <div className="pdp-desc-media" role="group" aria-label="Product pictures">
                {text.length === 0 && (
                  <h2 className="d" id="about-h">
                    About this <span className="hl">product</span>
                  </h2>
                )}
                <div className="desc-grid">
                  {images.map((im, i) => (
                    <DescImage key={i} src={im.src} alt={im.alt} wide={i === 0} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {showSpecs && (
        <section className="wrap pdp-specs2" id="specs" aria-labelledby="specs-h">
          <h2 className="d" id="specs-h">
            Product <span className="hl">specs</span>
          </h2>
          <dl className="spec-grid">
            {rest.map((s) => (
              <div key={s.name}>
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

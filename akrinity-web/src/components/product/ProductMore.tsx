'use client';

import { useEffect, useState } from 'react';
import type { ShopProduct } from '@/lib/shop-data';
import type { ContentPicture, DescBlock, ProductContent } from '@/lib/product-content';

/** A picture from the long description. Wide banners and logo strips (more than 2.4 times wider than tall) are hidden. */
function DescImage({
  src,
  alt,
  caption,
  wide,
  onGone,
}: {
  src: string;
  alt: string;
  /** Text shown over the picture (A+ content). */
  caption?: string;
  wide: boolean;
  /** Called once when the picture is hidden or fails to load, so the page can drop an empty picture column. */
  onGone: () => void;
}) {
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
          if (im.naturalHeight > 0 && im.naturalWidth / im.naturalHeight > 2.4) {
            setHide(true);
            onGone();
          }
        }}
        onError={() => {
          setFailed(true);
          onGone();
        }}
      />
      {caption ? <figcaption>{caption}</figcaption> : null}
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

/** The pictures of a product that has A+ content, wide banners left out. */
function usablePictures(c: ProductContent): ContentPicture[] {
  return c.pictures.filter((p) => !(p.width > 0 && p.height > 0 && p.width / p.height > 2.4));
}

/** The left column of the "pictures" layout: the About blocks, then the Product details lines. */
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

/** The two columns of the "text" layout: key features, then the description and what is in the package. */
function textLayout(c: ProductContent): { left: DescBlock[]; right: DescBlock[] } {
  const left: DescBlock[] = c.features.length
    ? [
        { t: 'h', text: 'Key features' },
        { t: 'ul', items: c.features },
      ]
    : [];
  const right: DescBlock[] = c.description.map((p) => ({ t: 'p', text: p }) as DescBlock);
  if (c.package.length) {
    right.push({ t: 'h', text: 'Package includes' });
    right.push({ t: 'ul', items: c.package });
  }
  return { left, right };
}

/** More text than this beside the pictures leaves a blank column, so the pictures move above the text. */
const LONG_TEXT = 1400;

function textLength(blocks: DescBlock[]): number {
  return blocks.reduce(
    (n, b) =>
      n +
      (b.t === 'p' || b.t === 'h' ? b.text.length : b.t === 'ul' ? b.items.join(' ').length : 0),
    0,
  );
}

/**
 * Everything under the buy area: a sticky section menu, the key facts as tiles, the description and
 * the full specification list. A product filled in with the content fields in WordPress uses those
 * (pictures layout or text layout); older products keep the description box and attributes.
 */
export function ProductMore({ product }: { product: ShopProduct }) {
  const content = product.content?.hasContent ? product.content : undefined;

  // Older products: description HTML and attributes.
  const blocks = product.longDescription ?? [];
  const oldText = blocks.filter((b) => b.t !== 'img');
  const oldImages = blocks.filter((b): b is Extract<DescBlock, { t: 'img' }> => b.t === 'img');
  const specs = product.specs ?? [];

  const facts = FACTS.map((f) => {
    const s = specs.find((x) => f.match.test(x.name));
    return s ? { label: f.label, value: s.value, name: s.name } : null;
  }).filter((x): x is { label: string; value: string; name: string } => Boolean(x));
  const factNames = new Set(facts.map((f) => f.name));
  const rest = specs.filter((s) => !factNames.has(s.name));

  // What the description section shows.
  const pics = content ? usablePictures(content) : [];
  const usePicturesLayout = Boolean(content && content.layout === 'pictures' && pics.length > 0);
  const left: DescBlock[] = content
    ? usePicturesLayout
      ? aboutBlocks(content)
      : textLayout(content).left
    : oldText;
  const right: DescBlock[] = content && !usePicturesLayout ? textLayout(content).right : [];
  const oldMediaCount = content ? 0 : oldImages.length;
  const mediaCount = content ? (usePicturesLayout ? pics.length : 0) : oldMediaCount;

  // Pictures that turn out to be banners or fail to load are counted, so when none is left the text uses the full width.
  const [gone, setGone] = useState(0);
  const hasMedia = mediaCount - gone > 0;
  const hasText = left.length > 0 || right.length > 0;
  const hasDesc = hasText || hasMedia;

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

  // How the description is laid out:
  //  rows    - products with A+ content: each block beside its own picture, alternating sides
  //  gallery - long text with pictures: the pictures in a strip above, the text in two columns below
  //  side    - short text: text on one side, pictures on the other
  const mode: 'rows' | 'gallery' | 'side' =
    content && usePicturesLayout
      ? 'rows'
      : hasMedia && textLength([...left, ...right]) > LONG_TEXT
        ? 'gallery'
        : 'side';
  const about = content?.about ?? [];
  const pairs = Math.min(about.length, pics.length);
  const twoColumns = hasMedia && left.length > 0;
  const split = !hasMedia && left.length > 0 && right.length > 0;

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

      {hasDesc && mode === 'rows' && content && (
        <section className="wrap pdp-desc" id="about" aria-labelledby="about-h">
          <h2 className="d" id="about-h">
            About this <span className="hl">product</span>
          </h2>
          {about.slice(0, pairs).map((blk, i) => (
            <div className={i % 2 ? 'a-row flip' : 'a-row'} key={i}>
              <div className="a-text">
                <h3>{blk.title}</h3>
                <p>{blk.text}</p>
              </div>
              <div className="a-media">
                <DescImage
                  src={pics[i].url}
                  alt={pics[i].alt || pics[i].caption}
                  caption={pics[i].caption}
                  wide={false}
                  onGone={() => setGone((g) => g + 1)}
                />
              </div>
            </div>
          ))}
          {about.length > pairs && (
            <div className="a-extra">
              {about.slice(pairs).map((blk, i) => (
                <div className="a-card" key={i}>
                  <h3>{blk.title}</h3>
                  <p>{blk.text}</p>
                </div>
              ))}
            </div>
          )}
          {pics.length > pairs && (
            <div className="gal-strip" role="group" aria-label="More pictures">
              {pics.slice(pairs).map((p, i) => (
                <DescImage
                  key={p.id || i}
                  src={p.url}
                  alt={p.alt || p.caption}
                  caption={p.caption}
                  wide={false}
                  onGone={() => setGone((g) => g + 1)}
                />
              ))}
            </div>
          )}
          {content.details.length > 0 && (
            <div className="a-card a-details">
              <h3>Product details</h3>
              <ul className="ticks">
                {content.details.map((d, i) => (
                  <li key={i}>{d.label ? `${d.label}: ${d.value}` : d.value}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {hasDesc && mode === 'gallery' && (
        <section className="wrap pdp-desc" id="about" aria-labelledby="about-h">
          <h2 className="d" id="about-h">
            About this <span className="hl">product</span>
          </h2>
          <div className="gal-strip" role="group" aria-label="Product pictures">
            {content
              ? pics.map((p, i) => (
                  <DescImage
                    key={p.id || i}
                    src={p.url}
                    alt={p.alt || p.caption}
                    caption={p.caption}
                    wide={false}
                    onGone={() => setGone((g) => g + 1)}
                  />
                ))
              : oldImages.map((im, i) => (
                  <DescImage
                    key={i}
                    src={im.src}
                    alt={im.alt}
                    wide={false}
                    onGone={() => setGone((g) => g + 1)}
                  />
                ))}
          </div>
          <div className="pdp-desc-grid text-only">
            <Prose blocks={[...left, ...right]} />
          </div>
        </section>
      )}

      {hasDesc && mode === 'side' && (
        <section className="wrap pdp-desc" id="about" aria-labelledby="about-h">
          <div
            className={
              twoColumns
                ? 'pdp-desc-grid'
                : split
                  ? 'pdp-desc-grid split'
                  : 'pdp-desc-grid text-only'
            }
          >
            {split && (
              <h2 className="d split-h" id="about-h">
                About this <span className="hl">product</span>
              </h2>
            )}
            {left.length > 0 && (
              <div className="pdp-desc-text">
                {!split && (
                  <h2 className="d" id="about-h">
                    About this <span className="hl">product</span>
                  </h2>
                )}
                <Prose blocks={left} />
              </div>
            )}
            {split && (
              <div className="pdp-desc-right">
                <Prose blocks={right} />
              </div>
            )}
            {hasMedia && (
              <div className="pdp-desc-media" role="group" aria-label="Product pictures">
                {left.length === 0 && (
                  <h2 className="d" id="about-h">
                    About this <span className="hl">product</span>
                  </h2>
                )}
                <div className={left.length === 0 ? 'desc-grid wide-grid' : 'desc-grid'}>
                  {content
                    ? pics.map((p, i) => (
                        <DescImage
                          key={p.id || i}
                          src={p.url}
                          alt={p.alt || p.caption}
                          caption={p.caption}
                          wide={i === 0 && left.length > 0}
                          onGone={() => setGone((g) => g + 1)}
                        />
                      ))
                    : oldImages.map((im, i) => (
                        <DescImage
                          key={i}
                          src={im.src}
                          alt={im.alt}
                          wide={i === 0}
                          onGone={() => setGone((g) => g + 1)}
                        />
                      ))}
                </div>
              </div>
            )}
            {!hasMedia && !split && right.length > 0 && left.length === 0 && (
              <div className="pdp-desc-right">
                <h2 className="d" id="about-h">
                  About this <span className="hl">product</span>
                </h2>
                <Prose blocks={right} />
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

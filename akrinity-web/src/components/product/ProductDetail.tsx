'use client';

import { useLiveProducts } from '@/lib/live-catalogue';
import { useEffect, useRef, useState, type ChangeEvent, type CSSProperties } from 'react';
import Link from 'next/link';
import { ModelViewer } from '@/components/three/ModelViewer';
import {
  COLOURS,
  MODE_LABEL,
  SHOP_MATERIALS,
  productSlug,
  type ColourKey,
  type ColourMode,
  type Material,
  type ShopProduct,
} from '@/lib/shop-data';
import { ProductReviews } from './ProductReviews';
import { splitLabel } from '@/lib/product-content';
import { ProductMore } from './ProductMore';
import { CompareButton, WishButton } from '@/components/shop/ProductActions';
import { useCart } from '@/lib/cart-store';

/**
 * Local test model, set in .env.local and only used by the development server. It is never part
 * of a production build, because the test model's licence is not cleared for public use.
 */
const DEV_MODEL_URL =
  process.env.NODE_ENV === 'development' ? process.env.NEXT_PUBLIC_DEV_MODEL_URL : undefined;

const SIZES = ['Small', 'Medium', 'Large'] as const;
type Size = (typeof SIZES)[number];

const PERSONAL_MAX = 40;
const PERSONAL_RULE = /^[A-Za-z0-9 ]*$/;
const PERSONAL_MESSAGE = 'Use letters, numbers and spaces only.';

interface ProductDetailProps {
  product: ShopProduct;
  /** Cross-sell row (goes well with this product). */
  crossSells: ShopProduct[];
  /** Suggested row (more like this). */
  related: ShopProduct[];
}

/** One product in a suggestion row. */
function SuggestCard({ p }: { p: ShopProduct }) {
  return (
    <Link className="card-p" href={`/product/${productSlug(p)}`}>
      <div className="img stripes">
        {p.images?.[0] && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.images[0]} alt="" loading="lazy" />
        )}
        <span className={p.inStock ? 'tag accent' : 'tag'}>
          {p.inStock ? 'In stock' : 'Made to order'}
        </span>
      </div>
      <div className="row">
        <div>
          <div className="name">{p.name}</div>
          <div className="price">{p.price ?? '₹[price]'}</div>
        </div>
        <span className="add" aria-hidden="true">
          +
        </span>
      </div>
    </Link>
  );
}

export function ProductDetail({
  product: builtProduct,
  crossSells: builtCross,
  related: builtRelated,
}: ProductDetailProps) {
  // Fresh data from WooCommerce replaces the built copy once it arrives (price, stock, photos, text).
  const live = useLiveProducts([builtProduct, ...builtCross, ...builtRelated]);
  const product = live.find((p) => p.id === builtProduct.id) ?? builtProduct;
  const refresh = (list: ShopProduct[]) =>
    list.map((r) => live.find((p) => p.id === r.id)).filter((p): p is ShopProduct => Boolean(p));
  const crossSells = refresh(builtCross);
  const related = refresh(builtRelated);
  const buyRef = useRef<HTMLDivElement>(null);

  // Desktop: the details stay in place while the photos scroll, then move on with the page at the
  // end of the photos. A panel taller than the screen is pinned by its bottom edge instead, so all
  // of it can be read while the photos scroll. There is no scrolling inside the panel.
  useEffect(() => {
    const el = buyRef.current;
    if (!el) return;
    const place = () => {
      if (window.innerWidth < 940) {
        el.style.top = '';
        return;
      }
      const top = Math.min(104, window.innerHeight - el.offsetHeight - 24);
      el.style.top = `${top}px`;
    };
    place();
    const ro = new ResizeObserver(place);
    ro.observe(el);
    window.addEventListener('resize', place);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', place);
    };
  }, []);
  const [view, setView] = useState<'photo' | '3d'>('photo');
  const [material, setMaterial] = useState<Material>(product.material);
  const [colour, setColour] = useState<ColourKey>(product.colours[0]);
  const [mode, setMode] = useState<ColourMode>(product.modes[0]);
  const sizeList = (product.sizes?.length ? product.sizes : [...SIZES]) as Size[];
  const materialList = product.materials?.length ? product.materials : SHOP_MATERIALS;
  const [size, setSize] = useState<Size>(sizeList.includes('Medium') ? 'Medium' : sizeList[0]);
  const [personal, setPersonal] = useState('');
  const [personalError, setPersonalError] = useState('');
  const [qty, setQty] = useState(1);
  const [pin, setPin] = useState('');
  const [pinMessage, setPinMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [status, setStatus] = useState('');
  const personalInput = useRef<HTMLInputElement>(null);
  const cartApi = useCart();

  const artStyle = { '--c': COLOURS[colour] } as CSSProperties;

  const onPersonalChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPersonal(value);
    setPersonalError(PERSONAL_RULE.test(value) ? '' : PERSONAL_MESSAGE);
  };

  const addToCart = () => {
    if (!PERSONAL_RULE.test(personal)) {
      setPersonalError(PERSONAL_MESSAGE);
      setStatus('');
      personalInput.current?.focus();
      return;
    }
    const detail = [material, colour, size, personal.trim() ? `Name: ${personal.trim()}` : '']
      .filter(Boolean)
      .join(' · ');
    cartApi.add({
      id: product.id,
      slug: productSlug(product),
      name: product.name,
      mode,
      qty,
      detail,
      price: product.price,
      image: product.images?.[0],
      madeToOrder: !product.inStock,
    });
    setStatus(
      `${qty} ${qty === 1 ? 'item' : 'items'} (${MODE_LABEL[mode].toLowerCase()}) added to cart.`,
    );
  };

  const checkPincode = () => {
    if (!/^\d{6}$/.test(pin)) {
      setPinMessage({ ok: false, text: 'Enter a 6-digit pincode.' });
      return;
    }
    setPinMessage({
      ok: true,
      text: 'Thanks. We deliver across India, and the delivery estimate for your pincode is shown at checkout.',
    });
  };

  const photos = product.images ?? [];
  const bulkTiers = product.bulkTiers ?? [];

  return (
    <main id="main">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <Link href="/shop">Shop</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{product.name}</span>
      </nav>

      <section className="pdp wrap" aria-labelledby="product-name">
        <div className="gallery">
          <div className="tabs" role="tablist" aria-label="Product views">
            <button
              type="button"
              id="tab-photo"
              role="tab"
              className="tab"
              aria-selected={view === 'photo'}
              aria-controls="pv-photo"
              tabIndex={view === 'photo' ? 0 : -1}
              onClick={() => setView('photo')}
            >
              Photos
            </button>
            <button
              type="button"
              id="tab-3d"
              role="tab"
              className="tab"
              aria-selected={view === '3d'}
              aria-controls="pv-3d"
              tabIndex={view === '3d' ? 0 : -1}
              onClick={() => setView('3d')}
            >
              3D view
            </button>
          </div>

          <div
            id="pv-photo"
            role="tabpanel"
            aria-labelledby="tab-photo"
            className="gal-stack"
            hidden={view !== 'photo'}
          >
            {photos.length ? (
              <>
                <figure className="gal-hero">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photos[0]} alt={`${product.name}, photo 1 of ${photos.length}`} />
                </figure>
                {photos.length > 1 && (
                  <div className="gal-grid">
                    {photos.slice(1).map((src, i) => (
                      <figure className="gal-tile" key={src + i}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={src}
                          alt={`${product.name}, photo ${i + 2} of ${photos.length}`}
                          loading="lazy"
                          decoding="async"
                        />
                      </figure>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="gal-hero gal-empty" style={artStyle} aria-hidden="true">
                  <div className="pc-obj" />
                </div>
                <div className="gal-grid" aria-hidden="true">
                  {[0, 1, 2, 3].map((i) => (
                    <div className="gal-tile gal-empty" style={artStyle} key={i}>
                      <div className="pc-obj" />
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <div
            id="pv-3d"
            role="tabpanel"
            aria-labelledby="tab-3d"
            className="main-3d"
            hidden={view !== '3d'}
          >
            {view === '3d' && <ModelViewer product={product} modelUrl={DEV_MODEL_URL} />}
          </div>
        </div>

        <div className="buy" ref={buyRef}>
          <div>
            <span className={product.inStock ? 'tag accent' : 'tag'}>
              {product.inStock ? 'In stock' : 'Made to order'}
            </span>
          </div>
          <h1 className={product.name.length > 50 ? 'd h1-long' : 'd'} id="product-name">
            {product.name}
          </h1>
          <div className="price">
            <span className="amt">
              {product.regularPrice && (
                <s style={{ opacity: 0.5, fontSize: '0.6em', marginRight: 10 }}>
                  {product.regularPrice}
                </s>
              )}
              {product.price ?? '₹[price]'}
            </span>
            <span className="muted" style={{ fontSize: 14, fontWeight: 500 }}>
              incl. GST
            </span>
          </div>
          {product.highlights?.length ? (
            <ul className="highlights">
              {product.highlights.slice(0, 6).map((h) => {
                const s = splitLabel(h);
                return (
                  <li key={h}>
                    {s ? (
                      <>
                        <b>{s.label}.</b> {s.rest}
                      </>
                    ) : (
                      h
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="desc">
              {product.description ??
                '[Two or three lines on what this is, who it is for and what makes it good.]'}
            </p>
          )}

          <fieldset className="opt">
            <legend>Colour option</legend>
            <div className="pills" role="radiogroup" aria-label="Colour option">
              {product.modes.map((m) => (
                <button
                  key={m}
                  type="button"
                  role="radio"
                  className="pill"
                  aria-checked={mode === m}
                  aria-pressed={mode === m}
                  onClick={() => setMode(m)}
                >
                  {MODE_LABEL[m]}
                </button>
              ))}
            </div>
            <p className="muted" style={{ fontSize: 14 }}>
              {mode === 'multi'
                ? 'Multi-colour prints take longer and may cost more. The extra cost and lead time are confirmed before payment.'
                : mode === 'painted'
                  ? 'Painted items are made to order. Painting is quoted separately, and we will tell you the cost first.'
                  : 'One filament colour, the quickest option.'}
            </p>
          </fieldset>

          <fieldset className="opt">
            <legend>Material</legend>
            <div className="pills" role="group" aria-label="Material">
              {materialList.map((m) => (
                <button
                  key={m}
                  type="button"
                  className="pill"
                  aria-pressed={material === m}
                  onClick={() => setMaterial(m)}
                >
                  {m}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="opt">
            <legend>
              Colour:{' '}
              <span style={{ fontWeight: 500, letterSpacing: 0, textTransform: 'none' }}>
                {colour}
              </span>
            </legend>
            <div className="swatches" role="group" aria-label="Colour">
              {product.colours.map((key) => (
                <button
                  key={key}
                  type="button"
                  className="sw"
                  aria-label={key}
                  aria-pressed={colour === key}
                  style={{ background: COLOURS[key] }}
                  onClick={() => setColour(key)}
                />
              ))}
            </div>
          </fieldset>

          <fieldset className="opt">
            <legend>Size</legend>
            <div className="pills" role="group" aria-label="Size">
              {sizeList.map((s) => (
                <button
                  key={s}
                  type="button"
                  className="pill"
                  aria-pressed={size === s}
                  onClick={() => setSize(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="opt">
            <label htmlFor="personal">
              Personalization{' '}
              <span
                className="muted"
                style={{ textTransform: 'none', letterSpacing: 0, fontWeight: 500, fontSize: 14 }}
              >
                (optional)
              </span>
            </label>
            <input
              ref={personalInput}
              id="personal"
              className="text"
              type="text"
              maxLength={PERSONAL_MAX}
              placeholder="Name or short text"
              value={personal}
              onChange={onPersonalChange}
              aria-invalid={personalError !== ''}
              aria-describedby="personal-hint personal-error"
            />
            <div className="hint" id="personal-hint">
              <span>
                {personal.length}/{PERSONAL_MAX} characters
              </span>
              <span>Letters, numbers and spaces</span>
            </div>
            <p className="err" id="personal-error" role="alert" hidden={personalError === ''}>
              {personalError}
            </p>
          </div>

          <div className="buyrow">
            <div className="qty">
              <button
                type="button"
                aria-label="Decrease quantity"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
              >
                −
              </button>
              <span aria-live="polite">{qty}</span>
              <button
                type="button"
                aria-label="Increase quantity"
                onClick={() => setQty((q) => Math.min(100, q + 1))}
              >
                +
              </button>
            </div>
            <button type="button" className="btn btn-primary" onClick={addToCart}>
              Add to cart
            </button>
            <WishButton id={product.id} name={product.name} className="pc-round pdp-heart" />
            <CompareButton id={product.id} name={product.name} className="cmp-btn cmp-btn--pdp" />
            <p className="status" role="status" aria-live="polite">
              {status}
            </p>
          </div>

          <Link className="btn btn-wide" href="/contact">
            Ask about this product
          </Link>

          <div className="notice">
            <span className="label">
              {product.inStock
                ? 'In stock, ships in [X] working days'
                : 'Made to order, ready in [X] working days'}
            </span>
            <span className="muted" style={{ fontSize: 14 }}>
              {product.inStock
                ? 'Packed and handed to the courier once payment is confirmed.'
                : 'Printed after you order. Cash on delivery is not offered for made-to-order items.'}
            </span>
          </div>

          <div className="opt">
            <label htmlFor="pin">Delivery estimate</label>
            <div className="pinrow">
              <input
                id="pin"
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="Enter pincode"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
              />
              <button type="button" className="btn btn-dark" onClick={checkPincode}>
                Check
              </button>
            </div>
            {pinMessage && (
              <p className={pinMessage.ok ? 'ok' : 'err'} role={pinMessage.ok ? 'status' : 'alert'}>
                {pinMessage.text}
              </p>
            )}
          </div>

          <div className="bulk">
            <span className="label">Buying in bulk?</span>
            {bulkTiers.length > 0 && (
              <div className="tiers">
                {bulkTiers.map((t) => (
                  <div key={t.from}>
                    <span>{t.to ? `${t.from} to ${t.to}` : `${t.from} and up`}</span>
                    <b>{t.price}</b>
                    <small>per piece</small>
                  </div>
                ))}
              </div>
            )}
            <Link
              className="link"
              href={`/business?product=${encodeURIComponent(productSlug(product))}`}
            >
              Request a bulk quote →
            </Link>
          </div>
        </div>
      </section>

      <ProductMore product={product} />

      <section className="details" id="shipping">
        <div className="wrap">
          <div>
            <h2>Shipping</h2>
            <p>[Dispatch time, courier, tracking, free shipping threshold.]</p>
          </div>
          <div>
            <h2>Returns and warranty</h2>
            <p>
              [Return window for ready-made items. Made-to-order and personalized items are not
              returnable unless faulty.]
            </p>
          </div>
        </div>
      </section>

      <div className="wrap review-section" id="reviews">
        <ProductReviews productName={product.name} />
      </div>

      {crossSells.length > 0 && (
        <section className="related" aria-labelledby="cross-h">
          <div className="wrap">
            <h2 className="d" id="cross-h">
              Goes well <span className="hl">together</span>
            </h2>
            <div className="grid4">
              {crossSells.map((p) => (
                <SuggestCard key={p.id} p={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {related.length > 0 && (
        <section className="related" aria-labelledby="like-h">
          <div className="wrap">
            <h2 className="d" id="like-h">
              You may also <span className="hl">like</span>
            </h2>
            <div className="grid4">
              {related.map((p) => (
                <SuggestCard key={p.id} p={p} />
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

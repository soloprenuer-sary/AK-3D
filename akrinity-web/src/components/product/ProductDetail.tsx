'use client';

import { useLiveProducts } from '@/lib/live-catalogue';
import { Pic } from '@/components/ui/Pic';
import { useEffect, useRef, useState, type ChangeEvent, type CSSProperties } from 'react';
import Link from 'next/link';
import { PhotoCarousel } from './PhotoCarousel';
import {
  COLOURS,
  MODE_LABEL,
  productSlug,
  type ColourKey,
  type ColourMode,
  type Material,
  type ShopProduct,
} from '@/lib/shop-data';
import { ProductReviews } from './ProductReviews';
import { ProductMore } from './ProductMore';
import { CompareButton, WishButton } from '@/components/shop/ProductActions';
import { useCart } from '@/lib/cart-store';
import { addWorkingDays, site } from '@/lib/site-config';

type Size = string;

/** On phones the short description is cut to 140 characters at a word, ending with "…". */
const PHONE_DESC_MAX = 140;
function clipPhone(text: string): string {
  if (text.length <= PHONE_DESC_MAX) return text;
  const cut = text.slice(0, PHONE_DESC_MAX - 1);
  const space = cut.lastIndexOf(' ');
  const base = space > 80 ? cut.slice(0, space) : cut;
  return base.replace(/[\s,;:.–-]+$/, '') + '…';
}

const PERSONAL_MAX = 40;
const PERSONAL_RULE = /^[A-Za-z0-9 ]*$/;
const PERSONAL_MESSAGE = 'Use letters, numbers and spaces only.';

interface ProductDetailProps {
  product: ShopProduct;
  /** Cross-sell row (goes well with this product). */
  crossSells: ShopProduct[];
  /** Suggested row (more like this). */
  related: ShopProduct[];
  /** A draft preview: show exactly the data given, never the public copy. */
  preview?: boolean;
}

/** One product in a suggestion row. */
function SuggestCard({ p }: { p: ShopProduct }) {
  return (
    <Link className="card-p" href={`/product/${productSlug(p)}`}>
      <div className="img stripes">
        {p.images?.[0] && (
          <Pic
            src={p.images[0]}
            alt=""
            sizes="(max-width: 640px) 50vw, 25vw"
            widths={[256, 384, 640]}
          />
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
  preview,
}: ProductDetailProps) {
  // Fresh data from WooCommerce replaces the built copy once it arrives (price, stock, photos, text).
  const live = useLiveProducts([builtProduct, ...builtCross, ...builtRelated]);
  const product = preview
    ? builtProduct
    : (live.find((p) => p.id === builtProduct.id) ?? builtProduct);
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
      const header = document.querySelector('header.site');
      const clear = (header ? header.getBoundingClientRect().height : 80) + 16;
      const top = Math.min(clear, window.innerHeight - el.offsetHeight - 24);
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
  const [material, setMaterial] = useState<Material>(product.material);
  const [colour, setColour] = useState<ColourKey>(product.colours[0]);
  const [mode, setMode] = useState<ColourMode>(product.modes[0]);
  // Options come from the WooCommerce variations of a variable product. A simple product has none.
  const variation = product.variation;
  const modeList = variation?.modes ?? [];
  const colourList = variation?.colours ?? [];
  const materialList = variation?.materials ?? [];
  const sizeList = (variation?.sizes ?? []) as Size[];
  const personalise = variation?.personalise ?? false;
  const [size, setSize] = useState<Size>(
    sizeList.includes('Medium') ? 'Medium' : (sizeList[0] ?? 'Medium'),
  );
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
    // Only the options this product offers go into the cart line.
    const chosen = variation
      ? [
          materialList.length ? material : '',
          colourList.length ? colour : '',
          sizeList.length ? size : '',
          personalise && personal.trim() ? `Name: ${personal.trim()}` : '',
        ]
      : [];
    const detail = chosen.filter(Boolean).join(' · ');
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
    if (!/^[1-9]\d{5}$/.test(pin)) {
      setPinMessage({ ok: false, text: 'Enter a 6-digit pincode.' });
      return;
    }
    // An estimate from the printing and delivery days set for the shop (the exact date comes with the tracking link).
    const by = addWorkingDays(new Date(), site.printDays + site.deliveryDays);
    const day = by.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
    setPinMessage({
      ok: true,
      text: `Estimated delivery to ${pin}: by ${day}. We deliver across India with tracking; the exact date comes with your tracking link.`,
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
          {photos.length ? (
            <PhotoCarousel photos={photos} name={product.name} />
          ) : (
            <div className="gal-stack">
              <div className="gal-hero gal-empty" style={artStyle} aria-hidden="true">
                <div className="pc-obj" />
              </div>
            </div>
          )}
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
          {product.description && (
            <>
              <p className="desc short-desc short-desc-phone">{clipPhone(product.description)}</p>
              <p className="desc short-desc short-desc-full">{product.description}</p>
            </>
          )}

          {modeList.length > 0 && (
            <fieldset className="opt">
              <legend>Colour option</legend>
              <div className="pills" role="radiogroup" aria-label="Colour option">
                {modeList.map((m) => (
                  <button
                    key={m}
                    type="button"
                    role="radio"
                    className="pill"
                    aria-checked={mode === m}
                    onClick={() => setMode(m)}
                  >
                    {MODE_LABEL[m]}
                  </button>
                ))}
              </div>
              {mode !== 'single' && (
                <p className="muted" style={{ fontSize: 14 }}>
                  {mode === 'multi'
                    ? 'Multi-colour prints take longer and may cost more. The extra cost and lead time are confirmed before payment.'
                    : 'Painted items are made to order. Painting is quoted separately, and we will tell you the cost first.'}
                </p>
              )}
            </fieldset>
          )}

          {materialList.length > 0 && (
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
          )}

          {colourList.length > 0 && (
            <fieldset className="opt">
              <legend>
                Colour:{' '}
                <span style={{ fontWeight: 500, letterSpacing: 0, textTransform: 'none' }}>
                  {colour}
                </span>
              </legend>
              <div className="swatches" role="group" aria-label="Colour">
                {colourList.map((key) => (
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
          )}

          {sizeList.length > 0 && (
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
          )}

          {personalise && (
            <details className="opt opt-details" open={personal !== '' || personalError !== ''}>
              <summary>Add personalised text (optional)</summary>
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
            </details>
          )}

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
            <p className="status" role="status" aria-live="polite">
              {status}
            </p>
          </div>

          <div className="sub-links">
            <CompareButton id={product.id} name={product.name} className="cmp-btn" />
            <Link className="ask-link" href="/contact">
              Ask about this product
            </Link>
          </div>

          <details className="opt-details more-details">
            <summary>Delivery and bulk prices</summary>
            <div className="notice">
              <span className="label">
                {product.inStock
                  ? `In stock, ships in ${site.printDays} working days`
                  : 'Made to order, we confirm the lead time after you order'}
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
                <p
                  className={pinMessage.ok ? 'ok' : 'err'}
                  role={pinMessage.ok ? 'status' : 'alert'}
                >
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
          </details>
        </div>
      </section>

      <ProductMore product={product} />

      <section className="details" id="shipping">
        <div className="wrap">
          <div>
            <h2>Shipping</h2>
            <p> Dispatch within 7 days </p>
          </div>
          <div>
            <h2>Returns and warranty</h2>
            <p>For Return Contact us within 2 working days </p>
          </div>
        </div>
      </section>

      <div className="wrap review-section" id="reviews">
        <ProductReviews productId={product.id} productName={product.name} />
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

'use client';

import { useRef, useState, type ChangeEvent, type CSSProperties } from 'react';
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
  related: ShopProduct[];
}

export function ProductDetail({ product, related }: ProductDetailProps) {
  const [view, setView] = useState<'photo' | '3d'>('photo');
  const [thumb, setThumb] = useState(0);
  const [material, setMaterial] = useState<Material>(product.material);
  const [colour, setColour] = useState<ColourKey>(product.colours[0]);
  const [mode, setMode] = useState<ColourMode>(product.modes[0]);
  const [size, setSize] = useState<Size>('Medium');
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
    cartApi.add({ id: product.id, name: product.name, mode, qty });
    setStatus(
      `${qty} ${qty === 1 ? 'item' : 'items'} (${MODE_LABEL[mode].toLowerCase()}) added to cart. Sample only, no order is placed.`,
    );
  };

  const checkPincode = () => {
    if (!/^\d{6}$/.test(pin)) {
      setPinMessage({ ok: false, text: 'Enter a 6-digit pincode.' });
      return;
    }
    setPinMessage({
      ok: true,
      text: 'Sample check. Live delivery dates appear once the courier is connected.',
    });
  };

  const thumbs = product.images?.length ? product.images.map((_, i) => i) : [0, 1, 2, 3];

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
            className="main-img"
            hidden={view !== 'photo'}
            style={product.images?.length ? { background: '#FFFFFF' } : artStyle}
          >
            {product.images?.length ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.images[thumb] ?? product.images[0]}
                alt={`${product.name}, photo ${thumb + 1} of ${product.images.length}`}
                style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 28, padding: 16 }}
              />
            ) : (
              <div className="pc-obj" aria-hidden="true" />
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

          <div className="thumbs" role="group" aria-label="Photos">
            {thumbs.map((i) => (
              <button
                key={i}
                type="button"
                className="thumb"
                aria-label={`Photo ${i + 1}`}
                aria-pressed={thumb === i}
                onClick={() => setThumb(i)}
                style={
                  product.images?.[i]
                    ? { backgroundImage: `url(${product.images[i]})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                    : undefined
                }
              />
            ))}
          </div>
        </div>

        <div className="buy">
          <div>
            <span className={product.inStock ? 'tag accent' : 'tag'}>
              {product.inStock ? 'In stock' : 'Made to order'}
            </span>
          </div>
          <h1 className="d" id="product-name">
            {product.name}
          </h1>
          <div className="price">
            <span className="amt">{product.price ?? '₹[price]'}</span>
            <span className="muted" style={{ fontSize: 14, fontWeight: 500 }}>
              incl. GST
            </span>
          </div>
          <p className="desc">
            [Two or three lines on what this is, who it is for and what makes it good.]
          </p>

          <ProductReviews productName={product.name} />

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
              {SHOP_MATERIALS.map((m) => (
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
              <span style={{ fontWeight: 500, letterSpacing: 0, textTransform: 'none' }}>{colour}</span>
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
              {SIZES.map((s) => (
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
          </div>
          <p className="status" role="status" aria-live="polite">
            {status}
          </p>

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
            <div className="tiers">
              <div>
                <span>1 to 9</span>
                <b>{product.price ?? '₹[price]'}</b>
              </div>
              <div>
                <span>10 to 49</span>
                <b>{product.price ?? '₹[price]'}</b>
              </div>
              <div>
                <span>50 and up</span>
                <b>{product.price ?? '₹[price]'}</b>
              </div>
            </div>
            <Link className="link" href="/#business">
              Request a bulk quote →
            </Link>
          </div>
        </div>
      </section>

      <section className="details">
        <div className="wrap">
          <div>
            <h2>Details</h2>
            <p>[Dimensions, weight, finish, assembly and care instructions.]</p>
          </div>
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

      <section className="related">
        <div className="wrap">
          <h2 className="d">
            You may also <span className="hl">like</span>
          </h2>
          <div className="grid4">
            {related.map((p) => (
              <Link className="card-p" href={`/product/${productSlug(p)}`} key={p.id}>
                <div className="img stripes">
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
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { restoreCart } from '@/lib/shop-client';
import type { ColourMode } from '@/lib/shop-data';
import { CartThumb } from './CartThumb';
import { OrderSummary } from './OrderSummary';
import { OfferNote } from './OfferNote';
import { CartUpsell } from './CartUpsell';
import { formatRupees, parsePrice, useCart } from '@/lib/cart-store';
import { useWishlist } from '@/lib/lists-store';

export function EmptyCart() {
  return (
    <div className="empty show" role="status">
      <p>
        <b>Your cart is empty.</b>
      </p>
      <p className="muted">Add a product from the shop and it appears here.</p>
      <Link className="btn btn-primary" href="/shop">
        Shop ready-made
      </Link>
    </div>
  );
}

/** Full cart page: items with quantity controls, and the totals box. */
export function CartView() {
  const { lines, hasMadeToOrder, setQty, remove, clear, modeLabel, add } = useCart();
  const wish = useWishlist();
  const [restoreNote, setRestoreNote] = useState('');
  const restoring = useRef(false);

  // "Get my cart back" link from the reminder email: put the saved items back in the cart, once.
  useEffect(() => {
    if (restoring.current) return;
    const token = new URLSearchParams(window.location.search).get('restore');
    if (!token) return;
    restoring.current = true;
    restoreCart(token).then((r) => {
      window.history.replaceState(null, '', '/cart');
      if (!r.ok) {
        setRestoreNote(r.error);
        return;
      }
      for (const l of r.data.lines) {
        add({
          id: l.id,
          slug: l.slug,
          name: l.name,
          mode: (l.mode || 'single') as ColourMode,
          qty: l.qty,
          price: l.price,
          image: l.image,
          madeToOrder: l.madeToOrder,
        });
      }
      setRestoreNote(
        r.data.lines.length
          ? `Your cart is back: ${r.data.lines.length} ${r.data.lines.length === 1 ? 'item' : 'items'} added.`
          : 'Those items are no longer available.',
      );
    });
  }, [add]);

  if (lines.length === 0)
    return (
      <>
        {restoreNote && (
          <p className="meta" role="status">
            {restoreNote}
          </p>
        )}
        <EmptyCart />
      </>
    );

  return (
    <>
      {restoreNote && (
        <p className="meta" role="status" style={{ marginBottom: 16 }}>
          {restoreNote}
        </p>
      )}
      <div className="cart-page">
        <section aria-label="Cart items">
          <ul className="cart-rows">
            {lines.map((l) => {
              const unit = parsePrice(l.price);
              return (
                <li key={l.key} className="cart-row">
                  <CartThumb line={l} />
                  <div className="cart-row-info">
                    {l.slug ? (
                      <Link className="cart-row-name" href={`/product/${l.slug}`}>
                        {l.name}
                      </Link>
                    ) : (
                      <b className="cart-row-name">{l.name}</b>
                    )}
                    <span className="meta">
                      {[modeLabel(l.mode), l.detail].filter(Boolean).join(' · ')}
                    </span>
                    <span className={l.madeToOrder ? 'tag' : 'tag accent'}>
                      {l.madeToOrder ? 'Made to order · no cash on delivery' : 'In stock'}
                    </span>
                    {unit !== null && l.qty > 1 && (
                      <span className="meta">{formatRupees(unit)} each</span>
                    )}
                    <span className="cart-row-links">
                      <button
                        type="button"
                        className="link-btn"
                        onClick={() => remove(l.key)}
                        aria-label={`Remove ${l.name}`}
                      >
                        Remove
                      </button>
                      {!wish.has(l.id) && (
                        <button
                          type="button"
                          className="link-btn"
                          onClick={() => {
                            wish.toggle(l.id);
                            remove(l.key);
                          }}
                          aria-label={`Save ${l.name} for later`}
                        >
                          Save for later
                        </button>
                      )}
                    </span>
                  </div>
                  <div className="cart-row-side">
                    <b className="cart-row-price">
                      {unit === null ? '₹[price]' : formatRupees(unit * l.qty)}
                    </b>
                    <div className="qty" role="group" aria-label={`Quantity for ${l.name}`}>
                      <button
                        type="button"
                        aria-label={`Decrease quantity of ${l.name}`}
                        onClick={() => setQty(l.key, l.qty - 1)}
                      >
                        −
                      </button>
                      <span aria-live="polite">{l.qty}</span>
                      <button
                        type="button"
                        aria-label={`Increase quantity of ${l.name}`}
                        onClick={() => setQty(l.key, l.qty + 1)}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
          <CartUpsell lines={lines} />
          <div className="cart-actions">
            <Link className="btn" href="/shop">
              Continue shopping
            </Link>
            <button type="button" className="link-btn" onClick={clear}>
              Clear cart
            </button>
          </div>
        </section>

        <div className="cart-side">
          <OrderSummary />
          <OfferNote />
          {hasMadeToOrder && (
            <div className="notice">
              <span className="label">Made to order</span>
              <span className="muted" style={{ fontSize: 14 }}>
                Made-to-order items are paid in full or with an advance. Cash on delivery is only
                offered for stocked items under the order limit.
              </span>
            </div>
          )}
          <Link className="btn btn-primary btn-wide" href="/checkout">
            Go to checkout
          </Link>
        </div>
      </div>
    </>
  );
}

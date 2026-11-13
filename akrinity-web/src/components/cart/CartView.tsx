'use client';

import Link from 'next/link';
import { CartThumb } from './CartThumb';
import { OrderSummary } from './OrderSummary';
import { formatRupees, parsePrice, useCart } from '@/lib/cart-store';

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
  const { lines, hasMadeToOrder, setQty, remove, clear, modeLabel } = useCart();

  if (lines.length === 0) return <EmptyCart />;

  return (
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
                  <span className="meta">{[modeLabel(l.mode), l.detail].filter(Boolean).join(' · ')}</span>
                  <span className={l.madeToOrder ? 'tag' : 'tag accent'}>
                    {l.madeToOrder ? 'Made to order · no cash on delivery' : 'In stock'}
                  </span>
                  <button type="button" className="link-btn" onClick={() => remove(l.key)} aria-label={`Remove ${l.name}`}>
                    Remove
                  </button>
                </div>
                <div className="cart-row-side">
                  <b className="cart-row-price">{unit === null ? '₹[price]' : formatRupees(unit * l.qty)}</b>
                  <div className="qty" role="group" aria-label={`Quantity for ${l.name}`}>
                    <button type="button" aria-label={`Decrease quantity of ${l.name}`} onClick={() => setQty(l.key, l.qty - 1)}>
                      −
                    </button>
                    <span aria-live="polite">{l.qty}</span>
                    <button type="button" aria-label={`Increase quantity of ${l.name}`} onClick={() => setQty(l.key, l.qty + 1)}>
                      +
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        <div className="cart-actions">
          <Link className="btn" href="/shop">
            Continue shopping
          </Link>
          <button type="button" className="link-btn" onClick={clear}>
            Clear cart
          </button>
        </div>
        <p className="meta" style={{ marginTop: 14 }}>
          Add ₹[AMOUNT] more for free shipping.
        </p>
      </section>

      <div className="cart-side">
        <OrderSummary />
        {hasMadeToOrder && (
          <div className="notice">
            <span className="label">Made to order</span>
            <span className="muted" style={{ fontSize: 14 }}>
              Made-to-order items are paid in full or with an advance. Cash on delivery is only offered for stocked items
              under the order limit.
            </span>
          </div>
        )}
        <Link className="btn btn-primary btn-wide" href="/checkout">
          Go to checkout
        </Link>
      </div>
    </div>
  );
}

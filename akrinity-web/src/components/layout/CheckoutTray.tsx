'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { formatRupees, useCart } from '@/lib/cart-store';

/** How long the bar stays before it hides itself. */
const SHOW_MS = 8000;

/**
 * A bar at the bottom of the screen with a way to checkout. It appears when the cart changes (and
 * when the site is first opened with items in the cart), hides itself after a few seconds, and can
 * be closed. It waits while the pointer or keyboard is on it. The cart button in the header always
 * stays.
 */
export function CheckoutTray() {
  const { count, subtotal } = useCart();
  const path = usePathname();
  /** What the cart looked like when the bar was last hidden: it stays away until that changes. */
  const [hidden, setHidden] = useState('');
  const [hover, setHover] = useState(false);
  const [focus, setFocus] = useState(false);
  const cart = `${count}:${subtotal}`;
  const show = count > 0 && path !== '/checkout' && path !== '/cart' && hidden !== cart;

  useEffect(() => {
    if (!show || hover || focus) return;
    const timer = window.setTimeout(() => setHidden(cart), SHOW_MS);
    return () => window.clearTimeout(timer);
  }, [show, hover, focus, cart]);

  if (!show) return null;
  const close = () => {
    setHidden(cart);
    setHover(false);
    setFocus(false);
  };
  return (
    <div
      className={path.startsWith('/product/') ? 'checkout-tray is-product' : 'checkout-tray'}
      role="region"
      aria-label="Checkout"
      // A touch has no "leaving", so only a mouse pauses the timer.
      onPointerEnter={(e) => e.pointerType === 'mouse' && setHover(true)}
      onPointerLeave={() => setHover(false)}
      onFocus={(e) => setFocus(e.target.matches(':focus-visible'))}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setFocus(false)}
    >
      <span>
        <b>{count}</b> {count === 1 ? 'item' : 'items'}
        {subtotal !== null && <> · {formatRupees(subtotal)}</>}
      </span>
      <span className="checkout-tray-actions">
        <Link className="btn btn-sm btn-primary" href="/checkout">
          Checkout
        </Link>
        <button
          type="button"
          className="checkout-tray-close"
          aria-label="Close checkout bar"
          onClick={close}
        >
          ×
        </button>
      </span>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { formatRupees, useCart } from '@/lib/cart-store';

/** A bar at the bottom of the screen while the cart has items: go to checkout. */
export function CheckoutTray() {
  const { count, subtotal } = useCart();
  const path = usePathname();
  if (count === 0 || path === '/checkout' || path === '/cart') return null;
  return (
    <div
      className={path.startsWith('/product/') ? 'checkout-tray is-product' : 'checkout-tray'}
      role="region"
      aria-label="Checkout"
    >
      <span>
        <b>{count}</b> {count === 1 ? 'item' : 'items'}
        {subtotal !== null && <> · {formatRupees(subtotal)}</>}
      </span>
      <span className="checkout-tray-actions">
        <Link className="btn btn-sm btn-primary" href="/checkout">
          Checkout
        </Link>
      </span>
    </div>
  );
}

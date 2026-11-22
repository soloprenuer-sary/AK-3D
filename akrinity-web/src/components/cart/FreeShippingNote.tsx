'use client';

import { formatRupees, useCart } from '@/lib/cart-store';
import { site } from '@/lib/site-config';

/** "Add ₹X more for free shipping" with a bar, shown only when the owner has set the free-shipping amount. */
export function FreeShippingNote() {
  const { subtotal } = useCart();
  const goal = site.freeShippingFrom;
  if (goal <= 0 || subtotal === null) return null;
  const left = goal - subtotal;
  const pct = Math.max(0, Math.min(100, Math.round((subtotal / goal) * 100)));
  return (
    <div className="fs-note" style={{ marginTop: 14 }}>
      <p className="meta" style={{ margin: '0 0 6px' }}>
        {left > 0
          ? `Add ${formatRupees(left)} more for free shipping.`
          : 'Your order qualifies for free shipping.'}
      </p>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={goal}
        aria-valuenow={Math.min(subtotal, goal)}
        aria-label="Progress to free shipping"
        style={{
          height: 10,
          borderRadius: 6,
          border: '1.5px solid var(--ink)',
          background: 'var(--white)',
          overflow: 'hidden',
        }}
      >
        <div style={{ width: `${pct}%`, height: '100%', background: 'var(--accent)' }} />
      </div>
    </div>
  );
}

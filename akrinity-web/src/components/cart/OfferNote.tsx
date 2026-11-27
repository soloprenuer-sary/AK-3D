'use client';

import { cartOffer } from '@/lib/deals';
import { parsePrice, useCart } from '@/lib/cart-store';
import { useDeals } from '@/lib/live-catalogue';

/** What the cart earns and what to add for the next offer, with a bar. Settings come from WooCommerce. */
export function OfferNote() {
  const { lines, subtotal } = useCart();
  const deals = useDeals();
  if (subtotal === null) return null;
  const offer = cartOffer(
    deals,
    lines.map((l) => ({ id: l.id, qty: l.qty, unit: parsePrice(l.price) ?? 0 })),
  );
  if (!offer) return null;
  const pct = offer.max > 0 ? Math.max(0, Math.round((offer.value / offer.max) * 100)) : 0;
  return (
    <div className="fs-note" style={{ marginTop: 14 }}>
      <p className="meta" style={{ margin: '0 0 6px' }} role="status">
        {offer.message}
      </p>
      {offer.max > 0 && (
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={offer.max}
          aria-valuenow={offer.value}
          aria-label="Progress to cart offers"
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
      )}
    </div>
  );
}

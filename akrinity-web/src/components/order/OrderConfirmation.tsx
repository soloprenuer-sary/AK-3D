'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { OrderCard } from './OrderCard';
import { useCart } from '@/lib/cart-store';
import { lookupOrder } from '@/lib/shop-client';
import type { OrderLookup } from '@/lib/shop-types';

/** The page after checkout. Reads the order from the store (by its private key), so it only shows real orders. */
export function OrderConfirmation() {
  const params = useSearchParams();
  const orderId = params.get('order') ?? '';
  const key = params.get('key') ?? '';
  const { clear } = useCart();
  const [order, setOrder] = useState<OrderLookup | null>(null);
  const [error, setError] = useState('');
  const [tries, setTries] = useState(0);

  useEffect(() => {
    if (!orderId || !key) return;
    let live = true;
    lookupOrder({ order: orderId, key }).then((r) => {
      if (!live) return;
      if (!r.ok) {
        setError(r.error);
        return;
      }
      setOrder(r.data);
      // The cart is only emptied once the order is paid for, or it is cash on delivery.
      if (r.data.is_paid || r.data.payment_method === 'cod') clear();
      // A payment can take a moment to be confirmed: look again a few times.
      if (!r.data.is_paid && r.data.payment_method !== 'cod' && tries < 4) {
        window.setTimeout(() => live && setTries((t) => t + 1), 4000);
      }
    });
    return () => {
      live = false;
    };
    // clear never changes; tries drives the repeat look
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, key, tries]);

  if (!orderId || !key) {
    return (
      <div className="info-card">
        <h2>Looking for an order?</h2>
        <p className="muted">
          Open this page from the link we emailed you after you ordered, or look it up with your
          order number.
        </p>
        <Link className="btn btn-primary" href="/track-order">
          Track an order
        </Link>
      </div>
    );
  }
  if (error) {
    return (
      <div className="info-card">
        <h2>We could not load this order</h2>
        <p className="muted">{error}</p>
        <Link className="btn btn-primary" href="/track-order">
          Track an order
        </Link>
      </div>
    );
  }
  if (!order) return <p className="muted">Loading your order…</p>;

  const paidOk = order.is_paid || order.payment_method === 'cod';
  return (
    <>
      <div className="page-title" style={{ padding: 0 }}>
        <h1 className="d" style={{ marginTop: 8 }}>
          {paidOk ? (
            <>
              Order <span className="hl">#{order.number}</span> is in.
            </>
          ) : (
            <>
              Order <span className="hl">#{order.number}</span> is waiting.
            </>
          )}
        </h1>
        <p>
          {paidOk
            ? `We sent the details to ${order.email}. You can follow the order on this page or on the track order page.`
            : 'We have not received the payment yet. If you already paid, this page updates in a moment. If not, use the button below to pay.'}
        </p>
      </div>
      <section className="cart-page" style={{ paddingTop: 16 }}>
        <OrderCard order={order} />
        <div className="cart-side">
          <div className="info-card">
            <h2>Next steps</h2>
            <Link className="btn btn-wide" href="/track-order">
              Track this order later
            </Link>
            <Link className="btn btn-wide" href="/contact">
              Message us
            </Link>
            <Link className="btn btn-primary btn-wide" href="/shop">
              Continue shopping
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

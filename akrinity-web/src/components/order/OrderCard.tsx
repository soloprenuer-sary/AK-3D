import { Timeline, type TimelineStep } from '@/components/layout/Timeline';
import type { OrderLookup } from '@/lib/shop-types';
import { OrderActions, orderActions, type OrderAccess } from './OrderActions';

const rupees = (s: string | number): string => {
  const n = Number(s);
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 })}`;
};

/** The steps an order moves through, worked out from the WooCommerce status and the tracking number. */
export function orderSteps(o: OrderLookup): TimelineStep[] {
  const cod = o.payment_method === 'cod';
  const shipped = Boolean(o.tracking.awb) || o.status === 'completed' || o.status === 'in-transit';
  const dead = ['cancelled', 'refunded', 'failed'].includes(o.status);
  const waiting = o.status === 'pending';

  if (dead) {
    return [
      { title: 'Order received', state: 'done' },
      {
        title:
          o.status === 'refunded'
            ? 'Refunded'
            : o.status === 'cancelled'
              ? 'Cancelled'
              : 'Payment failed',
        note: o.status === 'failed' ? 'You can try paying again below.' : undefined,
        state: 'now',
      },
    ];
  }
  return [
    { title: 'Order received', state: 'done' },
    {
      title: cod
        ? 'Confirmed, pay on delivery'
        : o.is_paid
          ? 'Payment received'
          : 'Waiting for payment',
      note: waiting ? 'Your order starts once the payment goes through.' : undefined,
      state: waiting ? 'now' : 'done',
    },
    {
      title: 'Printing and packing',
      note: 'We print, check and pack your order.',
      state: waiting ? 'next' : shipped ? 'done' : 'now',
    },
    {
      title: 'Shipped',
      note: o.tracking.awb
        ? `${o.tracking.courier || 'Courier'} · ${o.tracking.awb}`
        : 'You get a tracking link by email.',

      state: o.status === 'completed' ? 'done' : shipped ? 'now' : 'next',
    },
    {
      title: 'Delivered',
      note:
        o.tracking.eta && o.status !== 'completed'
          ? `Expected ${new Date(o.tracking.eta).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}`
          : undefined,
      state: o.status === 'completed' ? 'done' : 'next',
    },
  ];
}

/** One order: where it is, what is in it, and what was charged. Used after paying and on the tracking page. */
export function OrderCard({ order: o, access }: { order: OrderLookup; access?: OrderAccess }) {
  const { canCancel, canReturn } = orderActions(o);
  return (
    <div className="info-card order-card">
      <h2>
        Order #{o.number} · {o.status_label}
      </h2>
      <p className="muted">
        Placed{' '}
        {new Date(o.date).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })}
        {o.city ? ` · delivering to ${o.city}` : ''} · {o.payment_title || 'Payment'}
      </p>

      <Timeline label="Order progress" steps={orderSteps(o)} />

      {o.tracking.url && (
        <p>
          <a
            className="btn btn-primary"
            href={o.tracking.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            Track the parcel
          </a>
        </p>
      )}
      {o.pay_url && (
        <p>
          <a className="btn btn-primary" href={o.pay_url}>
            Pay now
          </a>
        </p>
      )}

      {access && <OrderActions order={o} access={access} />}

      <p className="meta">
        Need help with this order?{' '}
        <a href={`/contact?topic=${encodeURIComponent('Order question')}&order=${o.number}`}>
          Ask a question
        </a>
        {!(access && (canCancel || canReturn)) && (
          <>
            {' · '}
            <a
              href={`/contact?topic=${encodeURIComponent('Cancel or return an order')}&order=${o.number}`}
            >
              Cancel or return
            </a>
          </>
        )}
      </p>

      <ul className="sum-lines">
        {o.items.map((i, n) => (
          <li key={`${i.name}-${n}`}>
            <span>
              {i.name} ×{i.quantity}
              {i.meta.length > 0 && <span className="meta"> {i.meta.join(' · ')}</span>}
            </span>
            <b>{rupees(i.total)}</b>
          </li>
        ))}
      </ul>
      <dl className="sum-rows">
        <div>
          <dt>Subtotal</dt>
          <dd>{rupees(o.subtotal)}</dd>
        </div>
        {Number(o.discount_total) > 0 && (
          <div>
            <dt>Discount</dt>
            <dd>−{rupees(o.discount_total)}</dd>
          </div>
        )}
        <div>
          <dt>Shipping</dt>
          <dd>{Number(o.shipping_total) > 0 ? rupees(o.shipping_total) : 'Free'}</dd>
        </div>
        {o.fees.map((f) => (
          <div key={f.name}>
            <dt>{f.name}</dt>
            <dd>{rupees(f.total)}</dd>
          </div>
        ))}
        <div className="sum-total">
          <dt>Total</dt>
          <dd>{rupees(o.total)}</dd>
        </div>
      </dl>
      {o.taxes.length > 0 && (
        <p className="meta">
          Includes GST: {o.taxes.map((t) => `${t.label} ${rupees(t.amount)}`).join(', ')}.
        </p>
      )}
    </div>
  );
}

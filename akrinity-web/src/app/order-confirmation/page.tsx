import type { Metadata } from 'next';
import Link from 'next/link';
import { Timeline } from '@/components/layout/Timeline';

export const metadata: Metadata = { title: 'Order confirmation', robots: { index: false } };

export default function OrderConfirmationPage() {
  return (
    <main id="main">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Order confirmation</span>
      </nav>

      <div className="wrap page-title">
        <span className="tag">Preview of the page shown after payment</span>
        <h1 className="d" style={{ marginTop: 16 }}>
          Order <span className="hl">[#1234]</span> is in.
        </h1>
        <p>
          We sent the details to [email]. Made-to-order items start printing after the advance clears. This is a
          preview with placeholder values: no order exists yet.
        </p>
      </div>

      <section className="wrap cart-page" style={{ paddingBottom: 'var(--sec)' }}>
        <div className="info-card">
          <h2>What happens next</h2>
          <Timeline
            label="Order progress"
            steps={[
              { title: 'Order received', note: 'Today', state: 'done' },
              { title: 'Advance paid', note: 'Balance due before dispatch', state: 'now' },
              { title: 'Printing', note: 'Expected in [X] working days' },
              { title: 'Shipped', note: 'Tracking link by message' },
            ]}
          />
        </div>
        <div className="cart-side">
          <div className="info-card">
            <h2>Next steps</h2>
            <button type="button" className="btn btn-wide" disabled>
              Download GST invoice PDF (after payment)
            </button>
            <Link className="btn btn-wide" href="/track-order">
              Track this order
            </Link>
            <Link className="btn btn-wide" href="/contact">
              Message us on WhatsApp
            </Link>
            <Link className="btn btn-primary btn-wide" href="/shop">
              Continue shopping
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

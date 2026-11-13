import type { Metadata } from 'next';
import Link from 'next/link';
import { SimpleForm } from '@/components/forms/SimpleForm';
import { Timeline } from '@/components/layout/Timeline';

export const metadata: Metadata = { title: 'Track an order', robots: { index: false } };

export default function TrackOrderPage() {
  return (
    <main id="main">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Track an order</span>
      </nav>

      <div className="wrap page-title">
        <h1 className="d">
          Track an <span className="hl">order</span>
        </h1>
        <p>Enter your order number and the phone number you used. No account is needed.</p>
      </div>

      <section className="wrap cart-page" style={{ paddingBottom: 'var(--sec)' }}>
        <div className="info-card">
          <h2>Find my order</h2>
          <SimpleForm
            id="track"
            submitLabel="Track order"
            successNote="Looks good. Order lookup is not connected yet, so no order was searched. Once the store is live, the timeline shows here."
            fields={[
              { name: 'order', label: 'Order number', required: true, placeholder: 'For example #1234' },
              { name: 'phone', label: 'Phone used on the order', required: true, rule: 'phone', type: 'tel', autoComplete: 'tel' },
            ]}
          />
        </div>
        <div className="info-card">
          <h2>How tracking will look</h2>
          <p className="muted">The steps your order moves through. Each one is updated as we work.</p>
          <Timeline
            label="Order steps"
            steps={[
              { title: 'Quote requested', note: 'Custom orders only' },
              { title: 'Quoted', note: 'Waiting for your approval' },
              { title: 'Approved' },
              { title: 'Advance paid', note: 'Balance due before dispatch' },
              { title: 'Printing', note: 'Layer progress shared when ready' },
              { title: 'Quality check' },
              { title: 'Shipped', note: 'Courier and tracking link' },
              { title: 'Delivered' },
            ]}
          />
        </div>
      </section>
    </main>
  );
}

import type { Metadata } from 'next';
import Link from 'next/link';
import { TrackOrder } from '@/components/order/TrackOrder';

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
        <p>Enter your order number and the email or phone number you used. No account is needed.</p>
      </div>

      <section className="wrap cart-page" style={{ paddingBottom: 'var(--sec)' }}>
        <TrackOrder />
      </section>
    </main>
  );
}

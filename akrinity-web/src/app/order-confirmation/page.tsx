import { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { OrderConfirmation } from '@/components/order/OrderConfirmation';

export const metadata: Metadata = { title: 'Order confirmation', robots: { index: false } };

export default function OrderConfirmationPage() {
  return (
    <main id="main">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Order confirmation</span>
      </nav>
      <div className="wrap" style={{ paddingBottom: 'var(--sec)' }}>
        <Suspense fallback={<p className="muted">Loading your order…</p>}>
          <OrderConfirmation />
        </Suspense>
      </div>
    </main>
  );
}

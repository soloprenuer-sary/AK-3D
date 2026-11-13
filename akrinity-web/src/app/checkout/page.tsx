import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckoutView } from '@/components/cart/CheckoutView';

export const metadata: Metadata = { title: 'Checkout', robots: { index: false } };

export default function CheckoutPage() {
  return (
    <main id="main">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <Link href="/cart">Cart</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Checkout</span>
      </nav>

      <div className="wrap page-title">
        <h1 className="d">
          <span className="hl">Checkout</span>
        </h1>
      </div>

      <section className="wrap" style={{ paddingBottom: 'var(--sec)' }}>
        <CheckoutView />
      </section>
    </main>
  );
}

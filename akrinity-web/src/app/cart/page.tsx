import type { Metadata } from 'next';
import Link from 'next/link';
import { CartView } from '@/components/cart/CartView';

export const metadata: Metadata = { title: 'Cart', description: 'Your Akrinity cart.' };

export default function CartPage() {
  return (
    <main id="main">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Cart</span>
      </nav>

      <div className="wrap page-title">
        <h1 className="d">
          Your <span className="hl">cart</span>
        </h1>
      </div>

      <section className="wrap" style={{ paddingBottom: 'var(--sec)' }}>
        <CartView />
      </section>
    </main>
  );
}

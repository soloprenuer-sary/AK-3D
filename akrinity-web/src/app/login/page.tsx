import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthTabs } from '@/components/forms/AuthTabs';

export const metadata: Metadata = { title: 'Sign in', robots: { index: false } };

export default function LoginPage() {
  return (
    <main id="main">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Sign in</span>
      </nav>

      <div className="wrap page-title">
        <h1 className="d">
          Your <span className="hl">account</span>
        </h1>
        <p>Sign in to see your orders and quotes. You can also check out as a guest, no account needed.</p>
      </div>

      <section className="wrap cart-page" style={{ paddingBottom: 'var(--sec)' }}>
        <AuthTabs />
        <div className="cart-side">
          <div className="info-card">
            <h2>No account needed</h2>
            <p className="muted">Check out as a guest, or follow an order with its number and your phone.</p>
            <Link className="btn btn-wide" href="/track-order">
              Track an order
            </Link>
            <Link className="btn btn-wide" href="/shop">
              Shop ready-made
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

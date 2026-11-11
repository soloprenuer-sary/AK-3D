import type { Metadata } from 'next';
import Link from 'next/link';
import { ShopBrowser } from '@/components/shop/ShopBrowser';

export const metadata: Metadata = { title: 'Shop' };

export default function ShopPage() {
  return (
    <main id="main">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Shop</span>
      </nav>

      <div className="wrap page-title">
        <h1 className="d">
          Shop <span className="hl">ready-made</span>
        </h1>
        <p>
          Finished prints, in stock and made to order. Made-to-order and personalized items are not
          available as cash on delivery.
        </p>
        <p className="sample-note">Sample products. Names, prices and availability are placeholders.</p>
      </div>

      <ShopBrowser />
    </main>
  );
}

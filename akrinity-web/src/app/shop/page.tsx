import type { Metadata } from 'next';
import Link from 'next/link';
import { ShopBrowser } from '@/components/shop/ShopBrowser';
import { CATEGORIES, categorySlug } from '@/lib/shop-data';

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
          Finished prints in single colour or multi-colour, in stock and made to order. Made-to-order
          and personalised items are not available as cash on delivery.
        </p>
        <p className="sample-note">Sample products. Names, prices and availability are placeholders.</p>
      </div>

      <section className="wrap" aria-labelledby="cat-tiles-h" style={{ paddingBottom: 8 }}>
        <h2 id="cat-tiles-h" className="label" style={{ marginBottom: 14 }}>
          Browse by category
        </h2>
        <div className="cat-grid">
          {CATEGORIES.map((c) => (
            <Link key={c.name} className="cat-card" href={`/shop/${categorySlug(c)}`}>
              <span className="cat-card-name">{c.name}</span>
              <span className="cat-card-sub">{c.subs.slice(0, 3).join(' · ')}</span>
              <span className="arrow" aria-hidden="true">→</span>
            </Link>
          ))}
        </div>
      </section>

      <ShopBrowser />
    </main>
  );
}

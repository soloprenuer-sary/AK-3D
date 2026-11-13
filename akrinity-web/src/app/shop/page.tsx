import type { Metadata } from 'next';
import Link from 'next/link';
import { ShopBrowser } from '@/components/shop/ShopBrowser';
import { CATEGORIES, categorySlug } from '@/lib/shop-data';
import { getProducts } from '@/lib/catalogue';

export const metadata: Metadata = { title: 'Shop' };

export default async function ShopPage() {
  const products = await getProducts();
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

      <nav className="wrap cat-strip" aria-label="Categories">
        {CATEGORIES.map((c) => (
          <Link key={c.name} className="cat-pill" href={`/shop/${categorySlug(c)}`}>
            {c.name}
          </Link>
        ))}
      </nav>

      <ShopBrowser products={products} />
    </main>
  );
}

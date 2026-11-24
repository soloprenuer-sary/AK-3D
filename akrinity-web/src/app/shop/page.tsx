import type { Metadata } from 'next';
import Link from 'next/link';
import { ShopBrowser } from '@/components/shop/ShopBrowser';
import { getListProducts } from '@/lib/catalogue';
import { getCategoryTree } from '@/lib/category-content';

/** Pages are rebuilt in the background at most once a minute, so WordPress edits appear without a deploy. */
export const revalidate = 60;

export const metadata: Metadata = { title: 'Shop' };

export default async function ShopPage() {
  const [products, tree] = await Promise.all([getListProducts(), getCategoryTree()]);
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
      </div>

      <nav className="wrap cat-strip" aria-label="Categories">
        {tree.map((c) => (
          <Link key={c.slug} className="cat-pill" href={`/shop/${c.slug}`}>
            {c.name}
          </Link>
        ))}
      </nav>

      <ShopBrowser products={products} />
    </main>
  );
}

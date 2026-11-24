import type { Metadata } from 'next';
import Link from 'next/link';
import { WishlistView } from '@/components/shop/WishlistView';
import { getListProducts } from '@/lib/catalogue';

export const revalidate = 60;
export const metadata: Metadata = { title: 'Wishlist', description: 'Products you have saved.' };

export default async function WishlistPage() {
  const products = await getListProducts();
  return (
    <main id="main">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Wishlist</span>
      </nav>
      <div className="wrap page-title">
        <h1 className="d">
          Your <span className="hl">wishlist</span>
        </h1>
        <p>Products you saved. They stay in this browser, so you can come back to them.</p>
      </div>
      <section className="wrap" style={{ paddingBottom: 'var(--sec)' }} aria-label="Saved products">
        <WishlistView products={products} />
      </section>
    </main>
  );
}

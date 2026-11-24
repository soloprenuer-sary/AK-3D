import type { Metadata } from 'next';
import Link from 'next/link';
import { CompareView } from '@/components/shop/CompareView';
import { getCompareProducts } from '@/lib/catalogue';

export const revalidate = 60;
export const metadata: Metadata = {
  title: 'Compare products',
  description: 'Compare up to four products side by side.',
};

export default async function ComparePage() {
  const products = await getCompareProducts();
  return (
    <main id="main">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Compare</span>
      </nav>
      <div className="wrap page-title">
        <h1 className="d">
          Compare <span className="hl">products</span>
        </h1>
        <p>
          Up to four products side by side. Add products with the Compare button on any product.
        </p>
      </div>
      <section className="wrap" style={{ paddingBottom: 'var(--sec)' }} aria-label="Comparison">
        <CompareView products={products} />
      </section>
    </main>
  );
}

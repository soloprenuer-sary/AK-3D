import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ShopBrowser } from '@/components/shop/ShopBrowser';
import { CATEGORIES, categorySlug, findCategory } from '@/lib/shop-data';

type Params = { params: Promise<{ category: string }> };

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ category: categorySlug(c) }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { category } = await params;
  const cat = findCategory(category);
  return { title: cat ? cat.name : 'Category', description: cat?.description };
}

export default async function CategoryPage({ params }: Params) {
  const { category } = await params;
  const cat = findCategory(category);
  if (!cat) notFound();

  return (
    <main id="main">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <Link href="/shop">Shop</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{cat.name}</span>
      </nav>

      <div className="wrap page-title">
        <h1 className="d">
          {cat.name.split(' ').slice(0, -1).join(' ') || cat.name}{' '}
          {cat.name.split(' ').length > 1 && <span className="hl">{cat.name.split(' ').slice(-1)[0]}</span>}
        </h1>
        <p>{cat.description}</p>
        <p className="sample-note">Sample products. Names, prices and availability are placeholders.</p>
      </div>

      <ShopBrowser categoryName={cat.name} subcategories={cat.subs} />
    </main>
  );
}

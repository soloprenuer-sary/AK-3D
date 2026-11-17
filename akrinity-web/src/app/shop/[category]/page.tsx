import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ShopBrowser } from '@/components/shop/ShopBrowser';
import { CategoryExtras, CategoryHero } from '@/components/category/CategoryHero';
import { CATEGORIES, categorySlug, findCategory } from '@/lib/shop-data';
import { themeFor } from '@/lib/category-themes';
import { getProducts } from '@/lib/catalogue';

/** Pages are rebuilt in the background at most once a minute, so WordPress edits appear without a deploy. */
export const revalidate = 60;

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
  const theme = themeFor(category);
  if (!theme) notFound();
  const products = await getProducts();
  const count = products.filter((p) => p.category === cat.name).length;

  return (
    <main id="main">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <Link href="/shop">Shop</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{cat.name}</span>
      </nav>

      <CategoryHero category={cat} theme={theme} count={count} />

      <div id="products">
        <ShopBrowser products={products} categoryName={cat.name} subcategories={cat.subs} />
      </div>

      <CategoryExtras theme={theme} />
    </main>
  );
}

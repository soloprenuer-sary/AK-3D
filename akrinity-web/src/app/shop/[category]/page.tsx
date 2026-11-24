import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CategoryBrowser } from '@/components/category/CategoryBrowser';
import { CategoryHero, CategoryInfo } from '@/components/category/CategoryHero';
import { getCategoryCopy, getCategoryTree } from '@/lib/category-content';
import { findCategory } from '@/lib/shop-data';
import { themeFor } from '@/lib/category-themes';
import { getListProducts } from '@/lib/catalogue';

/** Pages are rebuilt in the background at most once a minute, so WordPress edits appear without a deploy. */
export const revalidate = 60;

type Params = { params: Promise<{ category: string }> };

export async function generateStaticParams() {
  return (await getCategoryTree()).map((c) => ({ category: c.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { category } = await params;
  const cat = findCategory(category, await getCategoryTree());
  const copy = cat ? (await getCategoryCopy())[cat.slug] : undefined;
  return {
    title: copy?.seoTitle ?? (cat ? cat.name : 'Category'),
    description: copy?.seoDescription ?? cat?.description,
  };
}

export default async function CategoryPage({ params }: Params) {
  const { category } = await params;
  const tree = await getCategoryTree();
  const cat = findCategory(category, tree);
  if (!cat) notFound();
  const theme = themeFor(category, tree.indexOf(cat));
  const [products, allCopy] = await Promise.all([getListProducts(), getCategoryCopy()]);
  const copy = allCopy[cat.slug];
  const mine = products.filter((p) => p.category === cat.name);
  const prices = mine
    .map((p) => Number((p.price ?? '').replace(/[^\d.]/g, '')))
    .filter((n) => n > 0);
  const fromPrice = prices.length
    ? `₹${Math.min(...prices).toLocaleString('en-IN')}`
    : undefined;

  return (
    <main id="main">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <Link href="/shop">Shop</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{cat.name}</span>
      </nav>

      <CategoryHero
        category={cat}
        theme={theme}
        count={mine.length}
        copy={copy}
        fromPrice={fromPrice}
      />

      <CategoryBrowser products={products} category={cat} tone={theme.bg} />

      <CategoryInfo theme={theme} copy={copy} />
    </main>
  );
}

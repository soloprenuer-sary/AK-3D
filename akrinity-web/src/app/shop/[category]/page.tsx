import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CategoryBrowser } from '@/components/category/CategoryBrowser';
import { CategoryHero, CategoryInfo } from '@/components/category/CategoryHero';
import { getCategoryContent } from '@/lib/category-content';
import { CATEGORIES, categorySlug, findCategory, subKey } from '@/lib/shop-data';
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
  const copy = cat ? (await getCategoryContent()).copy[subKey(cat.name)] : undefined;
  return {
    title: copy?.seoTitle ?? (cat ? cat.name : 'Category'),
    description: copy?.seoDescription ?? cat?.description,
  };
}

export default async function CategoryPage({ params }: Params) {
  const { category } = await params;
  const cat = findCategory(category);
  if (!cat) notFound();
  const theme = themeFor(category);
  if (!theme) notFound();
  const [products, content] = await Promise.all([getProducts(), getCategoryContent()]);
  const copy = content.copy[subKey(cat.name)];
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

      <CategoryBrowser
        products={products}
        category={cat}
        images={content.images}
        tone={theme.bg}
      />

      <CategoryInfo theme={theme} copy={copy} />
    </main>
  );
}

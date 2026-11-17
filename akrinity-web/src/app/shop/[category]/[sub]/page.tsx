import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ShopBrowser } from '@/components/shop/ShopBrowser';
import { findCategory, findSub, subHref } from '@/lib/shop-data';
import { getProducts } from '@/lib/catalogue';
import { getCategoryTree } from '@/lib/category-content';

/** Pages are rebuilt in the background at most once a minute, so WordPress edits appear without a deploy. */
export const revalidate = 60;

type Params = { params: Promise<{ category: string; sub: string }> };

export async function generateStaticParams() {
  return (await getCategoryTree()).flatMap((c) => c.subInfo.map((s) => ({ category: c.slug, sub: s.slug })));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { category, sub } = await params;
  const cat = findCategory(category, await getCategoryTree());
  const name = cat ? findSub(cat, sub) : undefined;
  if (!cat || !name) return { title: 'Shop' };
  return {
    title: `${name} · ${cat.name}`,
    description: `${name} from the ${cat.name} range, 3D printed in Mumbai.`,
  };
}

/** One sub-category: only its products, in the same layout as the shop page. */
export default async function SubCategoryPage({ params }: Params) {
  const { category, sub } = await params;
  const cat = findCategory(category, await getCategoryTree());
  const name = cat ? findSub(cat, sub) : undefined;
  if (!cat || !name) notFound();
  const products = await getProducts();
  const base = `/shop/${cat.slug}`;

  return (
    <main id="main">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <Link href="/shop">Shop</Link>
        <span aria-hidden="true">/</span>
        <Link href={base}>{cat.name}</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{name}</span>
      </nav>

      <div className="wrap page-title sub-title">
        <h1 className="d">
          {name} <span className="hl">{cat.name.toLowerCase()}</span>
        </h1>
        <p>
          Only {name.toLowerCase()} from the {cat.name} range. Printed in Mumbai, in stock and made to
          order.
        </p>
      </div>

      <nav className="wrap cat-strip" aria-label={`${cat.name} sub-categories`}>
        <Link className="cat-pill" href={base}>
          All {cat.name.toLowerCase()}
        </Link>
        {cat.subInfo.map((s) => (
          <Link
            key={s.slug}
            className="cat-pill"
            href={subHref(cat, s)}
            aria-current={s.name === name ? 'page' : undefined}
            style={s.name === name ? { background: 'var(--ink)', color: 'var(--paper)' } : undefined}
          >
            {s.name}
          </Link>
        ))}
      </nav>

      <ShopBrowser products={products} categoryName={cat.name} fixedSub={name} />
    </main>
  );
}

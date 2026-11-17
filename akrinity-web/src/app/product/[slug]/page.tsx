import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProductDetail } from '@/components/product/ProductDetail';
import { getProducts } from '@/lib/catalogue';
import { productSlug, type ShopProduct } from '@/lib/shop-data';

/** Pages are rebuilt in the background at most once a minute, so WordPress edits appear without a deploy. */
export const revalidate = 60;

type Params = { params: Promise<{ slug: string }> };

function findProduct(products: ShopProduct[], slug: string): ShopProduct | undefined {
  return products.find((p) => productSlug(p) === slug);
}

const ROW_SIZE = 4;

/**
 * The two rows under a product. WooCommerce's own "Cross-sells" and "Upsells" on the product are used
 * when they are set. Until then:
 *  - cross-sell row: products from other categories, a first guess at what goes well with it;
 *  - suggested row: more from the same category, then the rest.
 * A row shows as many products as exist (even one) and is hidden when there are none.
 */
function rowsFor(products: ShopProduct[], product: ShopProduct) {
  const others = products.filter((p) => p.id !== product.id);
  const byIds = (ids?: string[]) =>
    (ids ?? [])
      .map((id) => others.find((p) => p.id === id))
      .filter((p): p is ShopProduct => Boolean(p));

  let crossSells = byIds(product.crossSellIds).slice(0, ROW_SIZE);
  if (!crossSells.length)
    crossSells = others.filter((p) => p.category !== product.category).slice(0, ROW_SIZE);

  const taken = new Set(crossSells.map((p) => p.id));
  let suggested = byIds(product.upsellIds)
    .filter((p) => !taken.has(p.id))
    .slice(0, ROW_SIZE);
  if (!suggested.length) {
    const pool = others.filter((p) => !taken.has(p.id));
    suggested = [
      ...pool.filter((p) => p.sub === product.sub),
      ...pool.filter((p) => p.sub !== product.sub && p.category === product.category),
      ...pool.filter((p) => p.category !== product.category),
    ].slice(0, ROW_SIZE);
  }
  return { crossSells, suggested };
}

export async function generateStaticParams() {
  const products = await getProducts();
  return products.map((p) => ({ slug: productSlug(p) }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const product = findProduct(await getProducts(), slug);
  return { title: product ? product.name : 'Product' };
}

export default async function ProductPage({ params }: Params) {
  const { slug } = await params;
  const products = await getProducts();
  const product = findProduct(products, slug);
  if (!product) notFound();
  const { crossSells, suggested } = rowsFor(products, product);
  return <ProductDetail product={product} crossSells={crossSells} related={suggested} />;
}

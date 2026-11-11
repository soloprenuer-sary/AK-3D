import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProductDetail } from '@/components/product/ProductDetail';
import { SHOP_PRODUCTS, productSlug, type ShopProduct } from '@/lib/shop-data';

type Params = { params: Promise<{ slug: string }> };

function findProduct(slug: string): ShopProduct | undefined {
  return SHOP_PRODUCTS.find((p) => productSlug(p) === slug);
}

/** Related products: same category first, then the rest, excluding the current product. */
function relatedFor(product: ShopProduct): ShopProduct[] {
  const others = SHOP_PRODUCTS.filter((p) => p.id !== product.id);
  const same = others.filter((p) => p.category === product.category);
  const rest = others.filter((p) => p.category !== product.category);
  return [...same, ...rest].slice(0, 4);
}

export function generateStaticParams() {
  return SHOP_PRODUCTS.map((p) => ({ slug: productSlug(p) }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const product = findProduct(slug);
  return { title: product ? product.name : 'Product' };
}

export default async function ProductPage({ params }: Params) {
  const { slug } = await params;
  const product = findProduct(slug);
  if (!product) notFound();
  return <ProductDetail product={product} related={relatedFor(product)} />;
}

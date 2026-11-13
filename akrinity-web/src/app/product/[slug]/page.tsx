import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProductDetail } from '@/components/product/ProductDetail';
import { getProducts } from '@/lib/catalogue';
import { productSlug, type ShopProduct } from '@/lib/shop-data';

type Params = { params: Promise<{ slug: string }> };

function findProduct(products: ShopProduct[], slug: string): ShopProduct | undefined {
  return products.find((p) => productSlug(p) === slug);
}

/** Related products: same category first, then the rest, excluding the current product. */
function relatedFor(products: ShopProduct[], product: ShopProduct): ShopProduct[] {
  const others = products.filter((p) => p.id !== product.id);
  const same = others.filter((p) => p.category === product.category);
  const rest = others.filter((p) => p.category !== product.category);
  return [...same, ...rest].slice(0, 4);
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
  return <ProductDetail product={product} related={relatedFor(products, product)} />;
}

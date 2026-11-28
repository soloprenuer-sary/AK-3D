import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProductDetail } from '@/components/product/ProductDetail';
import { getProducts, slimProduct } from '@/lib/catalogue';
import { getDeals } from '@/lib/deals';
import { productSlug, type ShopProduct } from '@/lib/shop-data';
import { site } from '@/lib/site-config';

/** Pages are rebuilt in the background at most once a minute, so WordPress edits appear without a deploy. */
export const revalidate = 60;

type Params = { params: Promise<{ slug: string }> };

function findProduct(products: ShopProduct[], slug: string): ShopProduct | undefined {
  return products.find((p) => productSlug(p) === slug);
}

const ROW_SIZE = 4;

/**
 * The two rows under a product. WooCommerce's own "Cross-sells" and "Upsells" on the product are used
 * when they are set; a product without upsells shows the ones picked in Marketing. Until then:
 *  - cross-sell row: products from other categories, a first guess at what goes well with it;
 *  - suggested row: more from the same category, then the rest.
 * A row shows as many products as exist (even one) and is hidden when there are none.
 */
function rowsFor(products: ShopProduct[], product: ShopProduct, marketingIds: string[]) {
  const others = products.filter((p) => p.id !== product.id);
  const byIds = (ids?: string[]) =>
    (ids ?? [])
      .map((id) => others.find((p) => p.id === id))
      .filter((p): p is ShopProduct => Boolean(p));

  const upsells = byIds(product.upsellIds?.length ? product.upsellIds : marketingIds);
  let crossSells = byIds(product.crossSellIds).slice(0, ROW_SIZE);
  if (!crossSells.length)
    crossSells = others
      .filter((p) => p.category !== product.category && !upsells.includes(p))
      .slice(0, ROW_SIZE);

  const taken = new Set(crossSells.map((p) => p.id));
  let suggested = upsells.filter((p) => !taken.has(p.id)).slice(0, ROW_SIZE);
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
  if (!product) return { title: 'Product' };
  const text = (product.description ?? '').replace(/\s+/g, ' ').trim();
  // What the owner typed in Rank Math wins; otherwise the short description and the product name.
  const description =
    product.seoDescription ||
    (text.length > 20
      ? text.slice(0, 155)
      : `${product.name}. 3D printed in Bhiwandi, shipped across India. Prices include GST.`);
  const title = product.seoTitle || product.name;
  const image = product.images?.[0];
  return {
    // A typed SEO title is used exactly as written, without the site name added.
    title: product.seoTitle ? { absolute: product.seoTitle } : product.name,
    description,
    alternates: { canonical: `/product/${productSlug(product)}` },
    openGraph: {
      type: 'website',
      title,
      description,
      url: `/product/${productSlug(product)}`,
      ...(image ? { images: [{ url: image, alt: product.name }] } : {}),
    },
    twitter: { card: 'summary_large_image', ...(image ? { images: [image] } : {}) },
  };
}

export default async function ProductPage({ params }: Params) {
  const { slug } = await params;
  const products = await getProducts();
  const product = findProduct(products, slug);
  if (!product) notFound();
  const { upsellIds } = await getDeals();
  const { crossSells, suggested } = rowsFor(products, product, upsellIds);
  const price = Number((product.price ?? '').replace(/[^\d.]/g, ''));
  // What Google reads to show price, stock and stars next to the result.
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.images?.slice(0, 6),
    description: (product.description ?? '').replace(/\s+/g, ' ').trim() || product.name,
    brand: { '@type': 'Brand', name: 'Akrinity' },
    url: `${site.url}/product/${productSlug(product)}`,
    ...(price > 0
      ? {
          offers: {
            '@type': 'Offer',
            priceCurrency: 'INR',
            price: price.toFixed(2),
            availability: product.inStock
              ? 'https://schema.org/InStock'
              : 'https://schema.org/OutOfStock',
            itemCondition: 'https://schema.org/NewCondition',
            url: `${site.url}/product/${productSlug(product)}`,
          },
        }
      : {}),
    ...(product.reviewCount && product.reviewCount > 0 && product.rating
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: product.rating,
            reviewCount: product.reviewCount,
          },
        }
      : {}),
  };
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }}
      />
      <ProductDetail
        product={product}
        crossSells={crossSells.map((p) => slimProduct(p))}
        related={suggested.map((p) => slimProduct(p))}
      />
    </>
  );
}

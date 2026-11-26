/**
 * The data the pages use. Products and articles come straight from WordPress (the live backend)
 * at build time. There is no sample data: if WordPress cannot be reached the build stops with a
 * clear message, so a broken backend can never publish an empty or out-of-date site.
 */
import { fetchPosts, fetchStoreProducts } from './wp';
import { getCategoryTree } from './category-content';
import type { Guide } from './guides-data';
import type { ShopProduct } from './shop-data';

export async function getProducts(): Promise<ShopProduct[]> {
  const products = await fetchStoreProducts(await getCategoryTree());
  if (products === null) {
    throw new Error(
      'Could not read products from WordPress. Check NEXT_PUBLIC_WC_STORE_API_URL and that the backend is online.',
    );
  }
  return products;
}

/**
 * A product trimmed to what cards, filters, search and quick view need. Pages that hand a list of
 * products to the browser use this, so the page does not carry every product's long description,
 * content fields and spec table (the product page itself still gets the whole product).
 */
export function slimProduct(p: ShopProduct, keep: { specs?: boolean } = {}): ShopProduct {
  const c: ShopProduct = { ...p };
  delete c.longDescription;
  delete c.content;
  delete c.model;
  delete c.crossSellIds;
  delete c.upsellIds;
  if (!keep.specs) delete c.specs;
  return c;
}

/** Every product, trimmed for list pages. */
export async function getListProducts(): Promise<ShopProduct[]> {
  return (await getProducts()).map((p) => slimProduct(p));
}

/** Every product for the compare page: trimmed, but with the size and weight rows. */
export async function getCompareProducts(): Promise<ShopProduct[]> {
  return (await getProducts()).map((p) => slimProduct(p, { specs: true }));
}

export async function getGuides(): Promise<Guide[]> {
  const posts = await fetchPosts();
  if (posts === null) {
    throw new Error(
      'Could not read articles from WordPress. Check NEXT_PUBLIC_WC_STORE_API_URL and that the backend is online.',
    );
  }
  return posts;
}

/** Every article without its body, for cards, search and the home page slider. */
export async function getListGuides(): Promise<Guide[]> {
  return (await getGuides()).map((g) => ({ ...g, body: [] }));
}

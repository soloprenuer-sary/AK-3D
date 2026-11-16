/**
 * The data the pages use. Products and articles come straight from WordPress (the live backend)
 * at build time. There is no sample data: if WordPress cannot be reached the build stops with a
 * clear message, so a broken backend can never publish an empty or out-of-date site.
 */
import { fetchPosts, fetchStoreProducts } from './wp';
import type { Guide } from './guides-data';
import type { ShopProduct } from './shop-data';

export async function getProducts(): Promise<ShopProduct[]> {
  const products = await fetchStoreProducts();
  if (products === null) {
    throw new Error(
      'Could not read products from WordPress. Check NEXT_PUBLIC_WC_STORE_API_URL and that the backend is online.',
    );
  }
  return products;
}

export async function getGuides(): Promise<Guide[]> {
  const posts = await fetchPosts();
  if (posts === null) {
    throw new Error(
      'Could not read articles from WordPress. Check NEXT_PUBLIC_WP_GRAPHQL_URL and that the backend is online.',
    );
  }
  return posts;
}

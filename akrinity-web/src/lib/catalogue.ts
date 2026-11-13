/**
 * The data the pages use. WordPress is the source when it is reachable at build time; otherwise
 * the sample catalogue and articles are used, so the site always builds.
 */
import { fetchPosts, fetchStoreProducts } from './wp';
import { GUIDES, type Guide } from './guides-data';
import { SHOP_PRODUCTS, type ShopProduct } from './shop-data';

export async function getProducts(): Promise<ShopProduct[]> {
  const live = await fetchStoreProducts();
  return live && live.length > 0 ? live : SHOP_PRODUCTS;
}

export async function getGuides(): Promise<Guide[]> {
  const live = await fetchPosts();
  return live && live.length > 0 ? live : GUIDES;
}

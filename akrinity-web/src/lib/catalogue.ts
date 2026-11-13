/**
 * The data the pages use. WordPress is the source when it is reachable at build time; otherwise
 * the sample catalogue and articles are used, so the site always builds.
 */
import { fetchPosts, fetchStoreProducts } from './wp';
import { GUIDES, type Guide } from './guides-data';
import { SHOP_PRODUCTS, type ShopProduct } from './shop-data';

/**
 * Products that live in the code, not in WordPress yet: the ones with real product photos (for
 * example the twisted lamp). They are added after the WordPress products so they stay on the site
 * until they are created in WooCommerce. A WordPress product with the same name wins.
 */
const LOCAL_PRODUCTS = SHOP_PRODUCTS.filter((p) => p.images && p.images.length > 0);

export async function getProducts(): Promise<ShopProduct[]> {
  const live = await fetchStoreProducts();
  if (!live || live.length === 0) return SHOP_PRODUCTS;
  const names = new Set(live.map((p) => p.name.toLowerCase()));
  return [...live, ...LOCAL_PRODUCTS.filter((p) => !names.has(p.name.toLowerCase()))];
}

export async function getGuides(): Promise<Guide[]> {
  const live = await fetchPosts();
  return live && live.length > 0 ? live : GUIDES;
}

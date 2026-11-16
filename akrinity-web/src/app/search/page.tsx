import type { Metadata } from 'next';
import { SearchPage } from '@/components/search/SearchPage';
import { getGuides, getProducts } from '@/lib/catalogue';

/** Pages are rebuilt in the background at most once a minute, so WordPress edits appear without a deploy. */
export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Search',
  description: 'Search products, categories and articles.',
};

export default async function Search() {
  const [products, guides] = await Promise.all([getProducts(), getGuides()]);
  return <SearchPage products={products} guides={guides} />;
}

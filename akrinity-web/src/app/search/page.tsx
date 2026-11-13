import type { Metadata } from 'next';
import { SearchPage } from '@/components/search/SearchPage';
import { getGuides, getProducts } from '@/lib/catalogue';

export const metadata: Metadata = {
  title: 'Search',
  description: 'Search products, categories and articles.',
};

export default async function Search() {
  const [products, guides] = await Promise.all([getProducts(), getGuides()]);
  return <SearchPage products={products} guides={guides} />;
}

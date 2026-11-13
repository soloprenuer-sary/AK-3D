import type { Metadata } from 'next';
import { SearchPage } from '@/components/search/SearchPage';

export const metadata: Metadata = {
  title: 'Search',
  description: 'Search products, categories and articles.',
};

export default function Search() {
  return <SearchPage />;
}
